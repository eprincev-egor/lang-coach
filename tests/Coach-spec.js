"use strict";

const assert = require("assert");
const {Model} = require("model-layer");
const Coach = require("../lib/Coach");
const Syntax = require("../lib/Syntax");

describe("Coach tests", () => {
    
    it("coach.is(str)", () => {
        let coach = new Coach("some");

        assert.ok( coach.is("some") );
        assert.ok( coach.is("so") );
        assert.ok( !coach.is("wrong") );
    });
    
    it("coach.is(regExp)", () => {
        let coach = new Coach("123");

        assert.ok( coach.is(/\d\d/) );
        assert.ok( !coach.is(/8/) );
    });

    it("coach.is(Syntax)", () => {
        class ChildSyntax extends Syntax {
            static is(coach) {
                return coach.is("1");
            }
        }

        let coach;
        
        coach = new Coach("1");
        assert.ok( coach.is(ChildSyntax) );

        coach = new Coach("2");
        assert.ok( !coach.is(ChildSyntax) );
    });

    it("coach.is(undefined)", () => {
        let coach = new Coach("1");
        
        assert.throws(
            () => {
                coach.is();
            }, 
            err =>
                err.message == "invalid call, use is(arg) with regExp or string or Syntax"
        );
    });

    it("coach.skipSpace()", () => {
        let coach = new Coach(" \n\r\t 1 \t 2  \r 3");

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
        let coach = new Coach(" Hello World 1");

        let firstWord = coach.readWord();
        let secondWord = coach.readWord();

        assert.equal(firstWord, "hello");
        assert.equal(secondWord, "world");
    });

    it("coach.isWord()", () => {
        let coach;

        coach = new Coach("Hello");

        assert.ok( coach.isWord() );
        assert.ok( coach.isWord("hello") );
        assert.ok( !coach.isWord("home") );
        // keep position 
        assert.ok( coach.isWord("hello") );

        coach = new Coach("***");
        assert.ok( !coach.isWord() );
    });

    it("coach.read(regExp)", () => {
        let result;
        let coach = new Coach("hello!  world");

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

    it("coach.checkpoint()", () => {
        let coach = new Coach("some text here");

        assert.ok( coach.isWord("some") );

        assert.throws(
            () => {
                coach.rollback();
            }, 
            err =>
                err.message == "checkpoint does not exists"
        );
        
        coach.checkpoint();
        coach.readWord();

        assert.ok( coach.isWord("text") );

        coach.rollback();
        assert.ok( coach.isWord("some") );
    });

    it("coach.getPosition()", () => {
        let coach = new Coach("line 1\nline 2\rline 3\r\nline 4");

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

    it("coach.throwError(message)", () => {
        let coach = new Coach("some\nstring");

        coach.readWord();

        assert.throws(
            () => {
                coach.throwError("test");
            }, 
            err =>
                err.message == "SyntaxError at line 2" +
                    ", column 1" +
                    ", at near `string`" +
                    "\n Message: test"
        );
    });

    it("coach.expect(str)", () => {
        let result;
        let coach;
        
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
            err =>
                err.message == "SyntaxError at line 1" +
                    ", column 0" +
                    ", at near `some text`" +
                    "\n Message: expected: text"
        );
        assert.ok( coach.is("some") );
    });

    it("coach.expect(regExp)", () => {
        let result;
        let coach;

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
            err =>
                err.message == "SyntaxError at line 1" +
                    ", column 0" +
                    ", at near `some text`" +
                    "\n Message: expected: /text/"
        );
        assert.ok( coach.is("some") );
    });

    it("coach.expectWord(str)", () => {
        let result;
        let coach;
        
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
            err =>
                err.message == "SyntaxError at line 1" +
                    ", column 0" +
                    ", at near `wrong`" +
                    "\n Message: expected word: some"
        );
        assert.ok( coach.is("wrong") );
    });

    it("coach.expectWord()", () => {
        let result;
        let coach;
        
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
            err =>
                err.message == "SyntaxError at line 1" +
                    ", column 0" +
                    ", at near `***`" +
                    "\n Message: expected any word"
        );
        assert.ok( coach.is("***") );
    });
    
    it("coach.parseUnicode(unicode)", () => {
        let coach = new Coach("");

        let result = coach.parseUnicode("67");

        assert.equal( result, "g" );

        assert.throws(
            () => {
                coach.parseUnicode("***");
            }, 
            err =>
                err.message == "SyntaxError at line 1" +
                    ", column 0" +
                    ", at near ``" +
                    "\n Message: invalid unicode sequence: ***"
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
        class AnyWord extends Syntax {
            static structure() {
                return {
                    word: "string"
                };
            }

            static is(coach) {
                return coach.isWord();
            }

            static parse(coach, data) {
                data.word = coach.expectWord();
            }
        }

        class SomeLang extends Coach {}
        SomeLang.syntax( AnyWord );


        let coach = new SomeLang("any");

        assert.ok( coach.isAnyWord() );

        let syntax = coach.parseAnyWord();

        assert.ok( syntax instanceof AnyWord );
        assert.ok( syntax instanceof Model );

        assert.ok( syntax.get("word") == "any" );


        assert.throws(
            () => {
                SomeLang.syntax( false );
            }, 
            err =>
                err.message == "Syntax must be class"
        );
    });

    it("coach.parseComma('SyntaxName', options)", () => {
        class AnyWord extends Syntax {
            static structure() {
                return {
                    options: "string",
                    word: "string"
                };
            }

            static is(coach) {
                return coach.isWord();
            }

            static parse(coach, data, options) {
                data.options = JSON.stringify(options);
                data.word = coach.expectWord();
            }
        }

        class SomeLang extends Coach {}
        SomeLang.syntax( AnyWord );

        let coach = new SomeLang("one,\r two\n,\tthree  some");

        let result = coach.parseComma("AnyWord");

        assert.equal(result.length, 3);

        assert.ok( result[0] instanceof AnyWord );
        assert.ok( result[1] instanceof AnyWord );
        assert.ok( result[2] instanceof AnyWord );

        assert.ok( coach.is("some") );

        assert.equal( result[0].get("word"), "one" );
        assert.equal( result[0].get("options"), null );

        assert.equal( result[1].get("word"), "two" );
        assert.equal( result[1].get("options"), null );

        assert.equal( result[2].get("word"), "three" );
        assert.equal( result[2].get("options"), null );

        // run with options
        coach = new SomeLang("one,\r two\n,\tthree  some");
        result = coach.parseComma("AnyWord", {x: 1});


        assert.equal( result[0].get("options"), "{\"x\":1}" );
        assert.equal( result[1].get("options"), "{\"x\":1}" );
        assert.equal( result[2].get("options"), "{\"x\":1}" );
    });

    it("coach.parseChain('SyntaxName')", () => {
        class AnyWord extends Syntax {
            static structure() {
                return {
                    options: "string",
                    word: "string"
                };
            }

            static is(coach) {
                return coach.isWord();
            }

            static parse(coach, data, options) {
                data.options = JSON.stringify(options);
                data.word = coach.expectWord();
            }
        }

        class SomeLang extends Coach {}
        SomeLang.syntax( AnyWord );

        let coach = new SomeLang("one\r two\n \tthree  !!!");

        let result = coach.parseChain("AnyWord");

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
        result = coach.parseChain("AnyWord", {x: 1});

        assert.equal( result[0].get("options"), "{\"x\":1}" );
        assert.equal( result[1].get("options"), "{\"x\":1}" );
        assert.equal( result[2].get("options"), "{\"x\":1}" );
    });

});