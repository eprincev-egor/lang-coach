import {Syntax} from "./Syntax";

interface IAnyObject {
    [key: string]: any;
}

interface IPosition {
    index: number;
    line: number;
    column: number;
}

export class Coach {
    
    public str: string;
    public n: number;
    public i: number;

    public syntax: {
        [key: string]: new (...args: any) => Syntax<any>;
    };

    constructor(str: string) {
        this.str = str;
        this.n = str.length;
        this.i = 0;
    }
    
    skipSpace(): void {
        for (; this.i < this.n; this.i++) {
            const symbol = this.str[ this.i ];

            if ( !/\s/.test(symbol) ) {
                break;
            }
        }
    }

    readWord(): string {
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
    is(strOrRegExp: string | RegExp, options?: IAnyObject): boolean;
    is<K extends keyof this["syntax"]>(Syntax: this["syntax"][K], options?: IAnyObject): boolean;
    is<K extends keyof this["syntax"]>(
        regExpOrStringOrSyntax: string | 
            RegExp | 
            this["syntax"][K], 
        options?: IAnyObject
    ): boolean {
        this.setSyntaxReference();
        return this.isMain(regExpOrStringOrSyntax as any, options);
    }

    isMain(strOrRegExp: string | RegExp, options?: IAnyObject): boolean;
    isMain<K extends keyof this["syntax"]>(Syntax: this["syntax"][K], options?: IAnyObject): boolean;
    isMain<K extends keyof this["syntax"]>(
        regExpOrStringOrSyntax: string | 
            RegExp | 
            this["syntax"][K], 
        options?: IAnyObject
    ): boolean {
        const str = this.str.slice(this.i);

        if ( typeof regExpOrStringOrSyntax    === "function" ) {
            const ChildSyntax = regExpOrStringOrSyntax;
            const tmpSyntax = Object.create(ChildSyntax.prototype);
            return tmpSyntax.is(this, str, options);
        }

        else if ( typeof regExpOrStringOrSyntax === "string" ) {
            const testString = regExpOrStringOrSyntax;

            return str.indexOf(testString) === 0;
        }

        else if ( regExpOrStringOrSyntax instanceof RegExp ) {
            const regExp = regExpOrStringOrSyntax;

            return str.search(regExp) === 0;
        }

        else {
            throw new Error("invalid call, use is(arg) with regExp or string or Syntax");
        }
    }

    isWord(word?: string): boolean {
        if ( word == null ) {
            return this.is(/\w/i);
        }

        const i = this.i;
        const currentWord = this.readWord();
        this.i = i;

        return currentWord.toLowerCase() === word;
    }

    read(regExp: RegExp): string {
        const str = this.str.slice(this.i);
        const execResult = regExp.exec(str);

        if ( !execResult || execResult.index !== 0 ) {
            return null;
        }

        this.i += execResult[0].length;
        return execResult[0];
    }

    getPosition(): IPosition {
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

    
    throwError(message: string): void {
        const position = this.getPosition();

        const nearString = this.str.slice(Math.max(position.index, 0), position.index + 30);
        throw new Error(
            "SyntaxError at line " + position.line +
                ", column " + position.column +
                ", at near `" + nearString + "`" +
                "\n Message: " + message
        );
    }

    expect(strOrRegExp: string | RegExp, message?: string): string {
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

    
    expectWord(word?: string): string {
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

    parseUnicode(unicode: string): string {
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

    isEnd(): boolean {
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
    parseComma<K extends keyof this["syntax"], T extends this["syntax"][K]>(
        SomeSyntax: T, 
        options?: IAnyObject,
        elements: Array<InstanceType<T>> = []
    ): Array<InstanceType<T>> {
        if ( !this.is(SomeSyntax, options) ) {
            this.throwError("expected: " + SomeSyntax.name);
        }

        const elem = this.parse(SomeSyntax, options);
        elements.push( elem );

        if ( this.is(/\s*,/) ) {
            this.skipSpace();
            this.i++; // ,
            this.skipSpace();

            this.parseComma(SomeSyntax, options, elements);
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
    parseChain<K extends keyof this["syntax"], T extends this["syntax"][K]>(
        SomeSyntax: T, 
        options?: IAnyObject,
        elements: Array<InstanceType<T>> = []
    ): Array<InstanceType<T>> {

        const i = this.i;
        this.skipSpace();

        if ( this.is(SomeSyntax, options) ) {
            const elem = this.parse(SomeSyntax, options);
            elements.push( elem );

            this.parseChain(SomeSyntax, options, elements);
        } else {
            this.i = i;
        }

        return elements;
    }

    parse<K extends keyof this["syntax"], T extends this["syntax"][K]>(
        SomeSyntax: T,
        options?: IAnyObject
    ): InstanceType<T> {
        this.setSyntaxReference();
        return this.parseMain(SomeSyntax, options);
    }

    private setSyntaxReference() {
        // first call parse
        // need set reference to all syntax classes inside every syntax
        // (impossible make it inside constructor)
        if ( this.constructor.prototype.hasOwnProperty("_prepared") ) {
            return;
        }
        // speedup next call: .parse()
        this.parse = this.parseMain.bind(this);
        this.is = this.isMain.bind(this);

        this.constructor.prototype._prepared = true;
        for (const key in this.syntax) {
            const ChildSyntax = this.syntax[key];
            ChildSyntax.prototype.syntax = this.syntax;
        }
    }

    private parseMain<K extends keyof this["syntax"], T extends this["syntax"][K]>(
        SomeSyntax: T,
        options?: IAnyObject
    ): InstanceType<T> {
        const tmpSyntax = Object.create(SomeSyntax.prototype);
        const data = {};
        tmpSyntax.parse(this, data, options);
        return new SomeSyntax(data) as any;
    }
}
