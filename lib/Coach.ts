
interface IAnyObject {
    [key: string]: any;
}

interface IPosition {
    index: number;
    line: number;
    column: number;
}

// mac, windows, linux
const EOL_REG_EXP = /\r\n?|\n/;

export class Coach {
    
    public str: string;
    public n: number;
    public i: number;

    public syntax: any;

    private lastWord?: string;
    private lastWordStartIndex?: number;
    private lastWordEndIndex?: number;

    constructor(str: string) {
        this.str = str;
        this.n = str.length;
        this.i = 0;
        this.syntax = {};
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

        const startIndex = this.i;
        if ( startIndex === this.lastWordStartIndex ) {
            this.i = this.lastWordEndIndex!;
            return this.lastWord!;
        }

        this.skipSpace();

        for (; this.i < this.n; this.i++) {
            const symbol = this.str[ this.i ];

            if ( /[^\w]/.test(symbol) ) {
                break;
            }

            word += symbol;
        }

        this.skipSpace();

        const endIndex = this.i;
        const lowerWord = word.toLowerCase();
        
        this.lastWordStartIndex = startIndex;
        this.lastWordEndIndex = endIndex;
        this.lastWord = lowerWord;

        return lowerWord;
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

    read(regExp: RegExp): string | null {
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
        
        const lines = this.str.slice(0, index) .split(EOL_REG_EXP);
        
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

    getNearLines(linesCount: number): {
        currentLineIndex: number, 
        lines: string[]
    } {
        if ( linesCount % 2 === 0 ) {
            throw new Error("linesCount should be odd");
        }

        const half = Math.floor( linesCount / 2 );

        const prevLines = this.str.slice(0, this.i).split(EOL_REG_EXP);
        const nextLines = this.str.slice(this.i).split(EOL_REG_EXP);
        const currentLine = prevLines.pop()! + nextLines.shift();
        const nearLines: string[] = [];
        // current line index inside array nearLines
        let currentLineIndex = half;

        if ( half ) {
            nearLines.push(
                ...prevLines.slice( -half )
            );
        }
        
        nearLines.push( currentLine );

        if ( half ) {
            nearLines.push(
                ...nextLines.slice( 0, half )
            );
        }

        if ( half && prevLines.length < half ) {
            const needLinesCount = half - prevLines.length;
            nearLines.push(
                ...nextLines.slice( half, half + needLinesCount )
            );

            currentLineIndex -= needLinesCount;
        }

        else if ( half && nextLines.length < half ) {
            const needLinesCount = half - nextLines.length;
            const endIndex = prevLines.length - half;

            nearLines.unshift(
                ...prevLines.slice( 
                    endIndex - needLinesCount,
                    endIndex
                )
            );

            currentLineIndex += needLinesCount;
        }

        return {
            currentLineIndex,
            lines: nearLines
        };
    }

    
    throwError(message: string): never {
        const position = this.getPosition();

        const near = this.getNearLines(9);
        const maxLineNumber = position.line + near.lines.length - near.currentLineIndex;
        const nearString = near.lines.map((line, i) => {
            const lineNumber = position.line - near.currentLineIndex + i;
            const isCurrent = (
                i === near.currentLineIndex ? 
                    ">" : 
                    " "
            );

            // calculating zeroSpaces for lines 7,8,9
            // "\n   7 | line # 7" +
            // "\n   8 | line # 8" +
            // "\n>  9 | line # 9" +
            // "\n  10 | line # 10" +
            // "\n  11 | line # 11" +
            let zeroSpaces = "";
            for (let j = (lineNumber + "").length; j < (maxLineNumber + "").length; j++) {
                zeroSpaces += " ";
            }

            return `\n${isCurrent} ${zeroSpaces}${lineNumber} |${ line }`;
        }).join("");

        throw new Error(
            "SyntaxError at line " + position.line +
                ", column " + position.column + "\n" +
                nearString +
                "\n\n Message: " + message
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
            const execResult = regExp.exec(str)!;

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

    parseComma<K extends keyof this["syntax"], T extends this["syntax"][K]>(
        SomeSyntax: T, 
        options?: IAnyObject,
        elements: Array<InstanceType<T>> = []
    ): Array<InstanceType<T>> {
        
        // skipSpace() can be redefined
        this.skipSpace();

        if ( !this.is(SomeSyntax, options) ) {
            this.throwError("expected: " + SomeSyntax.name);
        }

        const elem = this.parse(SomeSyntax, options);
        elements.push( elem );

        // skipSpace() can be redefined
        this.skipSpace();

        if ( this.is(",") ) {
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

    setPositionBefore<K extends keyof this["syntax"], T extends this["syntax"][K]>(
        someSyntax: InstanceType<T>
    ): void {
        if ( "start" in someSyntax ) {
            this.i = someSyntax.start;
        }
        else {
            throw new Error("cannot detect syntax position");
        }
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

        tmpSyntax.start = this.i;
        tmpSyntax.parse(this, data, options);

        const syntax = new SomeSyntax(data) as any;
        syntax.start = tmpSyntax.start;
        return syntax;
    }
}
