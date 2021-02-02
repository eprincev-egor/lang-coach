
import assert from "assert";
import {Model, Types} from "model-layer";
import {Coach} from "../lib/Coach";
import {Syntax} from "../lib/Syntax";

describe("Coach tests", () => {
    
    it("coach.is(str)", () => {
        const coach = new Coach("some");

        assert.ok( coach.is("some") );
        assert.ok( coach.is("so") );
        assert.ok( !coach.is("wrong") );
    });
    
    it("coach.is(regExp)", () => {
        const coach = new Coach("123");

        assert.ok( coach.is(/\d\d/) );
        assert.ok( !coach.is(/8/) );
    });

    it("coach.is(Syntax)", () => {
        class ChildSyntax extends Syntax<ChildSyntax> {
            structure() {
                return {};
            }

            is(coach2: Coach) {
                return coach2.is("1");
            }

            parse() {
                // nothing
            }

            toString() {
                return "";
            }
        }

        let coach;
        
        coach = new Coach("1");
        assert.ok( coach.is(ChildSyntax) );

        coach = new Coach("2");
        assert.ok( !coach.is(ChildSyntax) );
    });

    it("coach.is(Syntax, options)", () => {
        class ChildSyntax extends Syntax<ChildSyntax> {
            structure() {
                return {};
            }

            is(coach2: Coach, str: string, options: any) {
                options = options || {alphabet: false};

                return (
                    coach2.is(/\d/) ||

                    options.alphabet &&
                    coach2.is(/\w/)
                );
            }

            parse() {
                // nothing
            }

            toString() {
                return "";
            }
        }

        let coach;
        
        coach = new Coach("1");
        assert.ok( coach.is(ChildSyntax) );

        coach = new Coach("a");
        assert.ok( !coach.is(ChildSyntax) );

        coach = new Coach("a");
        assert.ok( coach.is(ChildSyntax, {alphabet: true}) );
    });

    it("coach.is(undefined)", () => {
        const coach = new Coach("1");
        
        assert.throws(
            () => {
                (coach as any).is();
            }, 
            (err: Error) =>
                err.message === "invalid call, use is(arg) with regExp or string or Syntax"
        );
    });

    it("coach.skipSpace()", () => {
        const coach = new Coach(" \n\r\t 1 \t 2  \r 3");

        assert.ok( coach.is(" ") );
        assert.ok( coach.is(/\s/) );

        
        coach.skipSpace();
        assert.ok( coach.is("1") );
        coach.readWord();

        coach.skipSpace();
        assert.ok( coach.is("2") );
        coach.readWord();

        coach.skipSpace();
        assert.ok( coach.is("3") );
    });

    it("coach.readWord()", () => {
        const coach = new Coach(" Hello World 1");

        const firstWord = coach.readWord();
        const secondWord = coach.readWord();

        assert.equal(firstWord, "hello");
        assert.equal(secondWord, "world");
    });

    it("coach.readWord() after change offset", () => {
        const coach = new Coach(" Hello World 1");
        let word;

        word = coach.readWord();
        assert.equal(word, "hello");
        
        coach.i = 0;

        word = coach.readWord();
        assert.equal(word, "hello");
        assert.ok( coach.isWord("world") );
    });

    it("coach.isWord()", () => {
        let coach: Coach;

        coach = new Coach("Hello");

        assert.ok( coach.isWord() );
        assert.ok( coach.isWord("hello") );
        assert.ok( !coach.isWord("home") );
        // keep position 
        assert.ok( coach.isWord("hello") );

        coach = new Coach("***");
        assert.ok( !coach.isWord() );
    });

    it("coach.isWord() after change offset", () => {
        let coach: Coach;

        coach = new Coach("Hello world here");

        assert.ok( coach.isWord() );
        assert.ok( coach.isWord("hello") );
        assert.ok( !coach.isWord("home") );
        
        // change offset
        coach.i = 6;

        assert.ok( coach.isWord() );
        assert.ok( !coach.isWord("hello") );
        assert.ok( coach.isWord("world") );

        // again change offset
        coach.i = 12;

        assert.ok( coach.isWord() );
        assert.ok( !coach.isWord("hello") );
        assert.ok( !coach.isWord("world") );
        assert.ok( coach.isWord("here") );

    });

    it("coach.read(regExp)", () => {
        let result;
        const coach = new Coach("hello!  world");

        result = coach.read(/\w+/);

        assert.equal( result, "hello" );
        assert.ok( coach.is("!") );

        result = coach.read(/[!\s]+/);

        assert.equal( result, "!  " );
        assert.ok( coach.is("world") );

        // case sensitive
        result = coach.read(/WORLD/);

        assert.strictEqual( result, null );
        assert.ok( coach.is("world") );

        result = coach.read(/world/);

        assert.strictEqual( result, "world" );
    });

    it("coach.getPosition()", () => {
        const coach = new Coach("line 1\nline 2\rline 3\r\nline 4");

        assert.ok( coach.is(/line 1/) );
        assert.deepEqual(
            coach.getPosition(),
            {
                index: 0,
                line: 1,
                column: 0
            }
        );


        coach.read(/line/);
        assert.deepEqual(
            coach.getPosition(),
            {
                index: 4,
                line: 1,
                column: 4
            }
        );

        // go to line 2
        coach.read(/[^l]+/);

        assert.ok( coach.is(/line 2/) );
        assert.deepEqual(
            coach.getPosition(),
            {
                index: 7,
                line: 2,
                column: 1
            }
        );

        // go to line 3
        coach.read(/line/);
        coach.read(/[^l]+/);

        assert.ok( coach.is(/line 3/) );
        assert.deepEqual(
            coach.getPosition(),
            {
                index: 14,
                line: 3,
                column: 1
            }
        );

        // go to line 4
        coach.read(/line/);
        coach.read(/[^l]+/);

        assert.ok( coach.is(/line 4/) );
        assert.deepEqual(
            coach.getPosition(),
            {
                index: 22,
                line: 4,
                column: 1
            }
        );
    });

    it("coach.getNearLines()", () => {
        const coach = new Coach("line 1\nline 2\rline 3\r\nline 4\nline 5\nline 6");

        coach.i = 0;
        assert.deepStrictEqual(
            coach.getNearLines(3),
            {currentLineIndex: 0, lines: [
                "line 1",
                "line 2",
                "line 3"
            ]}
        );

        coach.i = 0;
        assert.deepStrictEqual(
            coach.getNearLines(5),
            {currentLineIndex: 0, lines: [
                "line 1",
                "line 2",
                "line 3",
                "line 4",
                "line 5"
            ]}
        );


        coach.i = 27;
        assert.deepStrictEqual(
            coach.getNearLines(3),
            {currentLineIndex: 1, lines: [
                "line 3",
                "line 4",
                "line 5"
            ]}
        );

        coach.i = 27;
        assert.deepStrictEqual(
            coach.getNearLines(1),
            {currentLineIndex: 0, lines: [
                "line 4"
            ]}
        );

        coach.i = coach.str.length;
        assert.deepStrictEqual(
            coach.getNearLines(3),
            {currentLineIndex: 2, lines: [
                "line 4",
                "line 5",
                "line 6"
            ]}
        );

        coach.i = coach.str.length;
        assert.deepStrictEqual(
            coach.getNearLines(5),
            {currentLineIndex: 4, lines: [
                "line 2",
                "line 3",
                "line 4",
                "line 5",
                "line 6"
            ]}
        );

        assert.throws(
            () => {
                coach.getNearLines(2);
            },
            (err: Error) =>
                /linesCount should be odd/.test(err.message)
        );
    });

    it("coach.throwError(message)", () => {
        
        assert.throws(
            () => {
                const coach = new Coach("some\nstring\nwith\nerror");

                coach.readWord();
                coach.throwError("test");
            }, 
            (err: Error) =>
                err.message === "SyntaxError at line 2" +
                    ", column 1" +
                    "\n" +
                    "\n  1 |some" +
                    "\n> 2 |string" +
                    "\n  3 |with" +
                    "\n  4 |error" +
                    "\n\n Message: test"
        );

        
        assert.throws(
            () => {
                let testString = "";
                for (let i = 0; i < 100; i++) {
                    testString += " line # " + (i + 1);
                    testString += "\r\n";
                }
                const coach = new Coach(testString);

                coach.i = 666;
                coach.expectWord("test");
            }, 
            (err: Error) =>
                err.message === "SyntaxError at line 57" +
                    ", column 4" +
                    "\n" +
                    "\n  53 | line # 53" +
                    "\n  54 | line # 54" +
                    "\n  55 | line # 55" +
                    "\n  56 | line # 56" +
                    "\n> 57 | line # 57" +
                    "\n  58 | line # 58" +
                    "\n  59 | line # 59" +
                    "\n  60 | line # 60" +
                    "\n  61 | line # 61" +
                    "\n\n Message: expected word: test"
        );

        
        assert.throws(
            () => {
                let testString = "";
                for (let i = 0; i < 100; i++) {
                    testString += " line # " + (i + 1);
                    testString += "\r\n";
                }
                const coach = new Coach(testString);

                coach.i = 90;
                coach.expectWord("test");
            }, 
            (err: Error) =>
                err.message === "SyntaxError at line 9" +
                    ", column 3" +
                    "\n" +
                    "\n   5 | line # 5" +
                    "\n   6 | line # 6" +
                    "\n   7 | line # 7" +
                    "\n   8 | line # 8" +
                    "\n>  9 | line # 9" +
                    "\n  10 | line # 10" +
                    "\n  11 | line # 11" +
                    "\n  12 | line # 12" +
                    "\n  13 | line # 13" +
                    "\n\n Message: expected word: test"
        );
    });

    it("coach.expect(str)", () => {
        let result;
        let coach: Coach;
        
        // call expect, when position before expected string
        coach = new Coach("some text");

        result = coach.expect("some");
        assert.equal( result, "some" );
        assert.ok( coach.is(" ") );


        // call expect, when position before another string
        coach = new Coach("some text");

        assert.throws(
            () => {
                coach.expect("text");
            }, 
            (err: Error) =>
                err.message === "SyntaxError at line 1" +
                    ", column 0" +
                    "\n" +
                    "\n> 1 |some text" +
                    "\n\n Message: expected: text"
        );
        assert.ok( coach.is("some") );


        assert.throws(
            () => {
                coach.expect("text", "custom error message");
            }, 
            (err: Error) =>
            err.message === "SyntaxError at line 1" +
                ", column 0" +
                "\n" +
                "\n> 1 |some text" +
                "\n\n Message: custom error message"
        );
    });

    it("coach.expect(regExp)", () => {
        let result;
        let coach: Coach;

        // call expect, when position before expected pattern
        coach = new Coach("some text");

        result = coach.expect(/some/);
        assert.equal( result, "some" );
        assert.ok( coach.is(" ") );

        // call expect, when position before another pattern
        coach = new Coach("some text");

        assert.throws(
            () => {
                coach.expect(/text/);
            }, 
            (err: Error) =>
                err.message === "SyntaxError at line 1" +
                    ", column 0" +
                    "\n" +
                    "\n> 1 |some text" +
                    "\n\n Message: expected: /text/"
        );
        assert.ok( coach.is("some") );


        assert.throws(
            () => {
                coach.expect(/text/, "custom error text");
            }, 
            (err: Error) =>
                err.message === "SyntaxError at line 1" +
                    ", column 0" +
                    "\n" +
                    "\n> 1 |some text" +
                    "\n\n Message: custom error text"
        );
    });

    it("coach.expectWord(str)", () => {
        let result;
        let coach: Coach;
        
        // call expect, when position before expected string
        coach = new Coach("  Expected!");

        result = coach.expectWord("expected");
        assert.equal( result, "expected" );
        assert.ok( coach.is("!") );


        // call expect, when position before another string
        coach = new Coach("wrong");

        assert.throws(
            () => {
                coach.expectWord("some");
            }, 
            (err: Error) =>
                err.message === "SyntaxError at line 1" +
                    ", column 0" +
                    "\n" +
                    "\n> 1 |wrong" +
                    "\n\n Message: expected word: some"
        );
        assert.ok( coach.is("wrong") );
    });

    it("coach.expectWord()", () => {
        let result;
        let coach: Coach;
        
        // call expect, when position before any word
        coach = new Coach("  WORD!");

        result = coach.expectWord();
        assert.equal( result, "word" );
        assert.ok( coach.is("!") );


        // call expect, when position before another string
        coach = new Coach("***");

        assert.throws(
            () => {
                coach.expectWord();
            }, 
            (err: Error) =>
                err.message === "SyntaxError at line 1" +
                    ", column 0" +
                    "\n" +
                    "\n> 1 |***" +
                    "\n\n Message: expected any word"
        );
        assert.ok( coach.is("***") );
    });
    
    it("coach.parseUnicode(unicode)", () => {
        const coach = new Coach("");

        const result = coach.parseUnicode("67");

        assert.equal( result, "g" );

        assert.throws(
            () => {
                coach.parseUnicode("***");
            }, 
            (err: Error) =>
                err.message === "SyntaxError at line 1" +
                    ", column 0" +
                    "\n" +
                    "\n> 1 |" +
                    "\n\n Message: invalid unicode sequence: ***"
        );
    });

    it("coach.isEnd", () => {
        let coach;

        coach = new Coach("");
        assert.ok( coach.isEnd() );
        
        coach = new Coach("test");
        assert.ok( !coach.isEnd() );
        
        coach.readWord();
        assert.ok( coach.isEnd() );
    });

    it("Coach.syntax", () => {
        class AnyWord extends Syntax<AnyWord> {
            structure() {
                return {
                    word: Types.String
                };
            }

            is(coach2: Coach) {
                return coach2.isWord();
            }

            parse(coach2: Coach, data: any) {
                data.word = coach2.expectWord();
            }

            toString() {
                return "";
            }
        }
        

        class SomeLang extends Coach {
            syntax = {
                AnyWord
            };
        }


        const coach = new SomeLang("any");

        assert.ok( coach.is(AnyWord) );

        const syntax = coach.parse(AnyWord);

        assert.ok( syntax instanceof AnyWord );
        assert.ok( syntax instanceof Model );

        assert.ok( syntax.get("word") === "any" );
    });

    it("coach.is(Syntax, options)", () => {
        class Some extends Syntax<Some> {
            structure() {
                return {};
            }

            is(coach2: Coach, str: string, options: any) {
                options = options || {alphabet: false};

                return (
                    coach2.is(/\d/) ||

                    options.alphabet &&
                    coach2.is(/\w/)
                );
            }

            parse() {
                // nothing
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                Some
            };
        }

        let coach: SomeLang;
        
        coach = new SomeLang("1");
        assert.ok( coach.is(Some) );

        coach = new SomeLang("a");
        assert.ok( !coach.is(Some) );

        coach = new SomeLang("a");
        assert.ok( coach.is(Some, { alphabet: true }) );
    });

    it("coach.parseComma(Syntax, options)", () => {
        class AnyWord extends Syntax<AnyWord> {

            structure() {
                return {
                    options: Types.String,
                    word: Types.String
                };
            }

            is(coach2: Coach) {
                return coach2.isWord();
            }

            parse(coach2: Coach, data: any, options: any) {
                data.options = JSON.stringify(options);
                data.word = coach2.expectWord();
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                AnyWord
            };

            skipSpace(): void {
                for (; this.i < this.n; this.i++) {
                    const symbol = this.str[ this.i ];
        
                    if ( !/[\s_]/.test(symbol) ) {
                        break;
                    }
                }
            }
        }

        let coach = new SomeLang("_ one _,\r two\n,\tthree _,_ four  some");

        let result = coach.parseComma(AnyWord);

        assert.equal(result.length, 4);

        assert.ok( result[0] instanceof AnyWord );
        assert.ok( result[1] instanceof AnyWord );
        assert.ok( result[2] instanceof AnyWord );
        assert.ok( result[3] instanceof AnyWord );

        assert.ok( coach.is("some") );

        assert.equal( result[0].get("word"), "one" );
        assert.equal( result[0].get("options"), null );

        assert.equal( result[1].get("word"), "two" );
        assert.equal( result[1].get("options"), null );

        assert.equal( result[2].get("word"), "three" );
        assert.equal( result[2].get("options"), null );

        assert.equal( result[3].get("word"), "four" );
        assert.equal( result[3].get("options"), null );

        // run with options
        coach = new SomeLang("one,\r two\n,\tthree  !!!");
        result = coach.parseComma(AnyWord, {x: 1});


        assert.equal( result[0].get("options"), "{\"x\":1}" );
        assert.equal( result[1].get("options"), "{\"x\":1}" );
        assert.equal( result[2].get("options"), "{\"x\":1}" );


        assert.throws(
            () => {
                coach = new SomeLang("!!");
                result = coach.parseComma(AnyWord);
            },
            (err: Error) =>
                /expected: AnyWord/.test( err.message )
        );
    });

    it("coach.parseComma(Syntax, options), check options in call: coach.is()", () => {
        class AnyWord extends Syntax<AnyWord> {

            structure() {
                return {
                    word: Types.String
                };
            }

            is(coach2: Coach, str: string, options: any) {
                options = options || {numbers: false};
                return (
                    coach2.is(/[a-z]/) ||

                    options.numbers &&
                    coach2.is(/\d/)
                );
            }

            parse(coach2: Coach, data: any, options: any) {
                options = options || {numbers: false};

                if ( options.numbers ) {
                    data.word = coach2.expect(/[\w\d]+/);
                } else {
                    data.word = coach2.expect(/[a-z]+/);
                }
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                AnyWord
            };
        }

        let coach = new SomeLang("1, 2, 3");

        let result = coach.parseComma(AnyWord, {
            numbers: true
        });

        assert.equal( result.length, 3 );
        assert.equal( result[0].get("word"), "1" );
        assert.equal( result[1].get("word"), "2" );
        assert.equal( result[2].get("word"), "3" );


        // without options
        coach = new SomeLang("some, word");

        result = coach.parseComma(AnyWord);
        assert.equal( result.length, 2 );
        assert.equal( result[0].get("word"), "some" );
        assert.equal( result[1].get("word"), "word" );
    });

    it("coach.parseChain('SyntaxName')", () => {
        class AnyWord extends Syntax<AnyWord> {

            structure() {
                return {
                    options: Types.String,
                    word: Types.String
                };
            }

            is(coach2: Coach) {
                return coach2.isWord();
            }

            parse(coach2: Coach, data: any, options: any) {
                data.options = JSON.stringify(options);
                data.word = coach.expectWord();
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                AnyWord
            };
        }

        let coach = new SomeLang("one\r two\n \tthree  !!!");

        let result = coach.parseChain(AnyWord);

        assert.equal(result.length, 3);

        assert.ok( result[0] instanceof AnyWord );
        assert.ok( result[1] instanceof AnyWord );
        assert.ok( result[2] instanceof AnyWord );

        assert.ok( coach.is("!!!") );

        assert.equal( result[0].get("word"), "one" );
        assert.equal( result[0].get("options"), null );

        assert.equal( result[1].get("word"), "two" );
        assert.equal( result[1].get("options"), null );

        assert.equal( result[2].get("word"), "three" );
        assert.equal( result[2].get("options"), null );

        // run with options
        coach = new SomeLang("one\r two\n \tthree  !!!");
        result = coach.parseChain(AnyWord, {x: 1});

        assert.equal( result[0].get("options"), "{\"x\":1}" );
        assert.equal( result[1].get("options"), "{\"x\":1}" );
        assert.equal( result[2].get("options"), "{\"x\":1}" );
    });

    it("coach.parseChain('SyntaxName', options), check options in call: coach.is()", () => {
        class AnyWord extends Syntax<AnyWord> {

            structure() {
                return {
                    word: Types.String
                };
            }

            is(coach2: Coach, str: string, options: any) {
                options = options || {numbers: false};
                return (
                    coach2.is(/[a-z]/) ||

                    options.numbers &&
                    coach2.is(/\d/)
                );
            }

            parse(coach2: Coach, data: any, options: any) {
                options = options || {numbers: false};

                if ( options.numbers ) {
                    data.word = coach2.expect(/[\w\d]+/);
                } else {
                    data.word = coach2.expect(/[a-z]+/);
                }
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                AnyWord
            };
        }

        let coach = new SomeLang("1 2 3");

        let result = coach.parseChain(AnyWord, {
            numbers: true
        });

        assert.equal( result.length, 3 );
        assert.equal( result[0].get("word"), "1" );
        assert.equal( result[1].get("word"), "2" );
        assert.equal( result[2].get("word"), "3" );


        // without options
        coach = new SomeLang("some 1");

        result = coach.parseChain(AnyWord);

        assert.equal( result.length, 1 );
        assert.equal( result[0].get("word"), "some" );
    });

    it("someSyntax.syntax references to all syntax", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String
                };
            }

            is(coach2: Coach) {
                return coach2.is(/[a-z]+/);
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.word = coach2.expect(/[a-z]+/);
            }

            toString() {
                return "";
            }
        }

        class Phrase extends Syntax<Phrase> {
            structure() {
                return {
                    words: Types.Array({
                        element: this.syntax.Word
                    })
                };
            }

            is() {
                return true;
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.words = coach2.parseChain(Word);
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                Word,
                Phrase
            };
        }

        const coach = new SomeLang("hello world");
        const phrase = coach.parse(Phrase);

        assert.deepStrictEqual(phrase.toJSON(), {
            words: [
                {word: "hello"},
                {word: "world"}
            ]
        });
    });

    it("someSyntax.syntax references to all syntax, check methods is", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String
                };
            }

            is(coach2: Coach) {
                return coach2.is(/[a-z]+/);
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.word = coach2.expect(/[a-z]+/);
            }

            toString() {
                return "";
            }
        }

        class Phrase extends Syntax<Phrase> {
            structure() {
                return {
                    words: Types.Array({
                        element: this.syntax.Word
                    })
                };
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.words = coach2.parseChain(Word);
            }

            is(coach2: SomeLang) {
                return coach2.is( this.syntax.Word as SomeLang["syntax"]["Word"] );
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                Word,
                Phrase
            };
        }

        // testing IS
        const coach = new SomeLang("phrase");

        assert.strictEqual(
            coach.is(Phrase),
            true
        );
    });

    it("WordSyntax has required field and we call coach.is(Word)", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String({
                        required: true
                    })
                };
            }

            is(coach2: Coach) {
                return coach2.is(/[a-z]+/);
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.word = coach2.expect(/[a-z]+/);
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                Word
            };
        }

        const coach = new SomeLang("hello world");

        assert.strictEqual(coach.is(Word), true);
    });

    it("WordSyntax has required field and we call coach.parse(Word)", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String({
                        required: true
                    })
                };
            }

            is(coach2: Coach) {
                return coach2.is(/[a-z]+/);
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.word = this.parseWord(coach2);
            }

            parseWord(coach2: SomeLang) {
                return coach2.expect(/[a-z]+/);
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                Word
            };
        }

        const coach = new SomeLang("hello world");
        const word = coach.parse(Word);

        assert.deepStrictEqual(word.toJSON(), {
            word: "hello"
        });
    });

    it("children in array should have valid parent reference", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String({
                        required: true
                    })
                };
            }

            is(coach2: Coach) {
                return coach2.is(/[a-z]+/);
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.word = this.parseWord(coach2);
            }

            parseWord(coach2: SomeLang) {
                return coach2.expect(/[a-z]+/);
            }

            toString() {
                return "";
            }
        }

        class Phrase extends Syntax<Phrase> {
            structure() {
                return {
                    words: Types.Array({
                        element: Word
                    })
                };
            }

            is(coach2: Coach) {
                return coach2.is(/[a-z]+/);
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.words = coach.parseChain(Word);
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                Word,
                Phrase
            };
        }

        const coach = new SomeLang("hello world");
        const phrase = coach.parse(Phrase);
        const firstWord = phrase.get("words")![0];
        const firstWordParent = firstWord.findParentInstance(Phrase);

        assert.ok(firstWordParent === phrase, "valid parent");
    });
    
    it("clone syntax and check parent reference", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String({
                        required: true
                    })
                };
            }

            is(coach2: Coach) {
                return coach2.is(/[a-z]+/);
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.word = this.parseWord(coach2);
            }

            parseWord(coach2: SomeLang) {
                return coach2.expect(/[a-z]+/);
            }

            toString() {
                return "";
            }
        }

        class Phrase extends Syntax<Phrase> {
            structure() {
                return {
                    words: Types.Array({
                        element: Word
                    })
                };
            }

            is(coach2: Coach) {
                return coach2.is(/[a-z]+/);
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.words = coach.parseChain(Word);
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                Word,
                Phrase
            };
        }

        const coach = new SomeLang("hello world");
        const phrase = coach.parse(Phrase);
        const phraseClone = phrase.clone();

        const firstWord = phraseClone.get("words")![0];
        const firstWordParent = firstWord.findParentInstance(Phrase);

        assert.ok(firstWordParent === phraseClone, "valid clone parent");
    });
    
    it("setPositionBefore(syntax)", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String({
                        required: true
                    })
                };
            }

            is(coach2: Coach) {
                return coach2.is(/[a-z]+/);
            }

            parse(coach2: SomeLang, data: this["TInputData"]) {
                data.word = this.parseWord(coach2);
            }

            parseWord(coach2: SomeLang) {
                return coach2.expect(/[a-z]+/);
            }

            toString() {
                return "";
            }
        }

        class SomeLang extends Coach {
            syntax = {
                Word
            };
        }

        const coach = new SomeLang("hello world");

        const hello = coach.parse(Word);
        coach.skipSpace();
        const world = coach.parse(Word);
        
        assert.strictEqual( (hello as any).start, 0, "valid start position for 'hello'" );
        assert.strictEqual( (world as any).start, 6, "valid start position for 'world'" );

        coach.setPositionBefore(hello);
        assert.ok( coach.isWord("hello"), "now position before 'hello'" );

        coach.setPositionBefore(world);
        assert.ok( coach.isWord("world"), "now position before 'world'" );
    });
    

});
