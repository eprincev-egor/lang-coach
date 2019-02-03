"use strict";

const Syntax = require("./Syntax");

class Coach {
    static syntax(SyntaxClass) {
        let isSyntaxClass = (
            typeof SyntaxClass == "function" &&
            SyntaxClass.prototype instanceof Syntax
        );

        if ( !isSyntaxClass ) {
            throw new Error("Syntax must be class");
        }

        let ChildCoach = this;
        let syntaxName = SyntaxClass.name;

        ChildCoach[ syntaxName ] = SyntaxClass;
        SyntaxClass.prototype.Coach = ChildCoach;

        let funcName;

        if ( SyntaxClass.is ) {
            funcName = "is" + syntaxName;
            ChildCoach.prototype[funcName] = function isSyntax() {
                return this.is(SyntaxClass);
            };
        }

        funcName = "parse" + syntaxName;
        ChildCoach.prototype[funcName] = function parseSyntax(options) {
            let coach = this;
            
            let data = SyntaxClass.parse(coach, options);
            let syntax = new SyntaxClass( data );

            return syntax;
        };
    }

    constructor(str) {
        this.str = str;
        this.n = str.length;
        this.i = 0;
    }
    
    skipSpace() {
        for (; this.i < this.n; this.i++) {
            let symbol = this.str[ this.i ];

            if ( !/\s/.test(symbol) ) {
                break;
            }
        }
    }

    readWord() {
        let word = "";

        this.skipSpace();

        for (; this.i < this.n; this.i++) {
            let symbol = this.str[ this.i ];

            if ( /[^\w]/.test(symbol) ) {
                break;
            }

            word += symbol;
        }

        this.skipSpace();

        return word.toLowerCase();
    }

    // test string (from current place) on regExp
    is(regExpOrStringOrSyntax) {
        let str = this.str.slice(this.i);

        let isString = (
            typeof regExpOrStringOrSyntax == "string"
        );
        let isSyntax = (
            typeof regExpOrStringOrSyntax    == "function" &&
            typeof regExpOrStringOrSyntax.is == "function"
        );
        let isRegExp = (
            regExpOrStringOrSyntax instanceof RegExp
        );

        if ( isSyntax ) {
            let Syntax = regExpOrStringOrSyntax;

            return Syntax.is(this, str);
        }

        else if ( isString ) {
            let testString = regExpOrStringOrSyntax;

            return str.indexOf(testString) === 0;
        }

        else if ( isRegExp ) {
            let regExp = regExpOrStringOrSyntax;

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

        let i = this.i;
        let currentWord = this.readWord();
        this.i = i;

        return currentWord.toLowerCase() == word;
    }

    read(regExp) {
        let str = this.str.slice(this.i);
        let execResult = regExp.exec(str);

        if ( !execResult || execResult.index !== 0 ) {
            return null;
        }

        this.i += execResult[0].length;
        return execResult[0];
    }

    checkpoint() {
        this._checkpoint = this.i;
    }

    rollback() {
        if ( this._checkpoint == null ) {
            throw new Error("checkpoint does not exists");
        }

        this.i = this._checkpoint;
    }

    
    getPosition() {
        let index = this.i;
        
        let lines = this.str.slice(0, index)
            // mac, windows, linux
            .split(/\r\n?|\n/);
        
        let line = lines.length;

        let column = 0;

        // find first break char
        for (let i = index; i > 0; i--) {
            let symbol = this.str[ i ];

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
        let position = this.getPosition();

        let nearString = this.str.slice(Math.max(position.index, 0), position.index + 30);
        throw new Error(
            "SyntaxError at line " + position.line +
                ", column " + position.column +
                ", at near `" + nearString + "`" +
                "\n Message: " + message
        );
    }

    expect(strOrRegExp, message) {
        if ( typeof strOrRegExp == "string" ) {
            let str = strOrRegExp;

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
            let regExp = strOrRegExp;
            let str = this.str.slice(this.i);
            let execResult = regExp.exec(str);

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

    
    expectWord(word) {
        let i = this.i;

        let currentWord = this.readWord();

        if ( word == null ) {
            if ( !currentWord ) {
                this.i = i;
                this.throwError("expected any word");
            }

            return currentWord;
        }

        if ( currentWord == word ) {
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

            unicode = eval("'\\u{" + unicode + "}'");
        } catch(err) {
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
    parseComma(SyntaxName, options) {
        let elements = [];
        let parseSyntax;

        if ( options ) {
            parseSyntax = this[ "parse" + SyntaxName ].bind(this, options);
        } else {
            parseSyntax = this[ "parse" + SyntaxName ].bind(this);
        }

        let isSyntax = this[ "is" + SyntaxName ].bind(this);

        this._parseComma(isSyntax, parseSyntax, elements);

        return elements;
    }

    _parseComma(isSyntax, parseSyntax, elements) {
        let elem;

        if ( isSyntax() ) {
            elem = parseSyntax();
            elements.push( elem );

            if ( this.is(/\s*,/) ) {
                this.skipSpace();
                this.i++; // ,
                this.skipSpace();

                this._parseComma(isSyntax, parseSyntax, elements);
            }
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
    parseChain(SyntaxName, options) {
        let elements = [];

        let parseSyntax;
        if ( options ) {
            parseSyntax = this[ "parse" + SyntaxName ].bind(this, options);
        } else {
            parseSyntax = this[ "parse" + SyntaxName ].bind(this);
        }
        let isSyntax = this[ "is" + SyntaxName ].bind(this);

        this._parseChain(isSyntax, parseSyntax, elements);

        return elements;
    }

    _parseChain(isSyntax, parseSyntax, elements) {
        let i = this.i;
        this.skipSpace();

        if ( isSyntax() ) {
            let elem = parseSyntax();
            elements.push( elem );

            this._parseChain(isSyntax, parseSyntax, elements);
        } else {
            this.i = i;
        }

        return elements;
    }

}


module.exports = Coach;