import {Syntax} from "./Syntax";

export class Coach {
    
    static syntax(SyntaxClass) {
        const isSyntaxClass = (
            typeof SyntaxClass === "function" &&
            SyntaxClass.prototype instanceof Syntax
        );

        if ( !isSyntaxClass ) {
            throw new Error("Syntax must be class");
        }

        const ChildCoach = this;
        const syntaxName = SyntaxClass.name;

        ChildCoach[ syntaxName ] = SyntaxClass;
        SyntaxClass.prototype.Coach = ChildCoach;

        let funcName;

        funcName = "is" + syntaxName;
        ChildCoach.prototype[funcName] = function isSyntax(options) {
            return this.is(SyntaxClass, options);
        };

        funcName = "parse" + syntaxName;
        ChildCoach.prototype[funcName] = function parseSyntax(options) {
            const coach = this;
            
            // modify by reference
            const data = {};
            SyntaxClass.parse(coach, data, options);
            
            const syntax = new SyntaxClass( data );

            return syntax;
        };
    }
    public str: string;
    public n: number;
    public i: number;

    constructor(str) {
        this.str = str;
        this.n = str.length;
        this.i = 0;
    }
    
    skipSpace() {
        for (; this.i < this.n; this.i++) {
            const symbol = this.str[ this.i ];

            if ( !/\s/.test(symbol) ) {
                break;
            }
        }
    }

    readWord() {
        let word = "";

        this.skipSpace();

        for (; this.i < this.n; this.i++) {
            const symbol = this.str[ this.i ];

            if ( /[^\w]/.test(symbol) ) {
                break;
            }

            word += symbol;
        }

        this.skipSpace();

        return word.toLowerCase();
    }

    // test string (from current place) on regExp
    is(regExpOrStringOrSyntax, options?) {
        const str = this.str.slice(this.i);

        const isString = (
            typeof regExpOrStringOrSyntax === "string"
        );
        const isSyntax = (
            typeof regExpOrStringOrSyntax    === "function" &&
            typeof regExpOrStringOrSyntax.is === "function"
        );
        const isRegExp = (
            regExpOrStringOrSyntax instanceof RegExp
        );

        if ( isSyntax ) {
            const ChildSyntax = regExpOrStringOrSyntax;

            return ChildSyntax.is(this, str, options);
        }

        else if ( isString ) {
            const testString = regExpOrStringOrSyntax;

            return str.indexOf(testString) === 0;
        }

        else if ( isRegExp ) {
            const regExp = regExpOrStringOrSyntax;

            return str.search(regExp) === 0;
        }

        else {
            throw new Error("invalid call, use is(arg) with regExp or string or Syntax");
        }
    }

    isWord(word) {
        if ( word == null ) {
            return this.is(/\w/i);
        }

        const i = this.i;
        const currentWord = this.readWord();
        this.i = i;

        return currentWord.toLowerCase() === word;
    }

    read(regExp) {
        const str = this.str.slice(this.i);
        const execResult = regExp.exec(str);

        if ( !execResult || execResult.index !== 0 ) {
            return null;
        }

        this.i += execResult[0].length;
        return execResult[0];
    }

    getPosition() {
        const index = this.i;
        
        const lines = this.str.slice(0, index)
            // mac, windows, linux
            .split(/\r\n?|\n/);
        
        const line = lines.length;

        let column = 0;

        // find first break char
        for (let i = index; i > 0; i--) {
            const symbol = this.str[ i ];

            if ( /[\n\r]/.test(symbol) ) {
                break;
            }

            column++;
        }

        return {
            index,
            line,
            column
        };
    }

    
    throwError(message) {
        const position = this.getPosition();

        const nearString = this.str.slice(Math.max(position.index, 0), position.index + 30);
        throw new Error(
            "SyntaxError at line " + position.line +
                ", column " + position.column +
                ", at near `" + nearString + "`" +
                "\n Message: " + message
        );
    }

    expect(strOrRegExp, message) {
        if ( typeof strOrRegExp === "string" ) {
            const str = strOrRegExp;

            if ( this.str.slice(this.i).indexOf(str) === 0 ) {
                this.i += str.length;
            } else {
                if ( message == null ) {
                    message = "expected: " + str;
                }
                this.throwError(message);
            }

            return str;
        } else {
            const regExp = strOrRegExp;
            const str = this.str.slice(this.i);
            const execResult = regExp.exec(str);

            if ( !execResult || execResult.index !== 0 ) {
                if ( message == null ) {
                    message = "expected: " + regExp;
                }
                this.throwError(message);
            }

            this.i += execResult[0].length;
            return execResult[0];
        }
    }

    
    expectWord(word?) {
        const i = this.i;

        const currentWord = this.readWord();

        if ( word == null ) {
            if ( !currentWord ) {
                this.i = i;
                this.throwError("expected any word");
            }

            return currentWord;
        }

        if ( currentWord === word ) {
            return currentWord;
        }

        this.i = i;
        this.throwError("expected word: " + word);
    }

    parseUnicode(unicode) {
        try {
            // unicode can be valid js code
            if ( !/^[\dabcdef]+$/i.test(unicode) ) {
                throw new Error();
            }

            // tslint:disable-next-line: no-eval
            unicode = eval("'\\u{" + unicode + "}'");
        } catch (err) {
            this.throwError("invalid unicode sequence: " + unicode);
        }

        return unicode;
    }

    isEnd() {
        return this.i >= this.str.length;
    }

    // parsing over "," and returning array of syntax objects
    // first argument SyntaxName is string: "Expression" or "ObjectLink" or any SyntaxName,
    // first symbol must be in upper case
    // or object like are:
    // {
    //    is: function,
    //    parse: function
    // }
    parseComma(SyntaxName, options?) {
        const elements = [];

        const parseSyntax = this[ "parse" + SyntaxName ].bind(this, options);
        const isSyntax = this[ "is" + SyntaxName ].bind(this, options);

        this._parseComma(SyntaxName, isSyntax, parseSyntax, elements);

        return elements;
    }

    _parseComma(SyntaxName, isSyntax, parseSyntax, elements) {
        if ( !isSyntax() ) {
            this.throwError("expected: " + SyntaxName);
        }

        const elem = parseSyntax();
        elements.push( elem );

        if ( this.is(/\s*,/) ) {
            this.skipSpace();
            this.i++; // ,
            this.skipSpace();

            this._parseComma(SyntaxName, isSyntax, parseSyntax, elements);
        }
    
        return elements;
    }


    // parsing chain of syntax objects separated by space symbols
    // first argument SyntaxName is string: "Expression" or "ObjectLink" or any SyntaxName,
    // first symbol must be in upper case
    // or object like are:
    // {
    //    is: function,
    //    parse: function
    // }
    parseChain(SyntaxName, options?) {
        const elements = [];

        const parseSyntax = this[ "parse" + SyntaxName ].bind(this, options);
        const isSyntax = this[ "is" + SyntaxName ].bind(this, options);

        this._parseChain(isSyntax, parseSyntax, elements);

        return elements;
    }

    _parseChain(isSyntax, parseSyntax, elements) {
        const i = this.i;
        this.skipSpace();

        if ( isSyntax() ) {
            const elem = parseSyntax();
            elements.push( elem );

            this._parseChain(isSyntax, parseSyntax, elements);
        } else {
            this.i = i;
        }

        return elements;
    }

}
