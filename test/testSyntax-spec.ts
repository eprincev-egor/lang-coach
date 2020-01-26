
import assert, { AssertionError } from "assert";
import {Types} from "model-layer";
import {Coach} from "../lib/Coach";
import {Syntax} from "../lib/Syntax";
import {testSyntax, ITestResult} from "../lib/testSyntax";

describe("testSyntax tests", () => {
    
    function localIt(name: string, handler: () => void) {
        handler();
    }

    it("testSyntax errors on wrong inputTest", () => {
        
        function test(
            SomeSyntax: any, 
            inputTest: any,
        ) {
            testSyntax(
                Coach,
                SomeSyntax, 
                inputTest,
                localIt
            );
        }

        assert.throws(
            () => {
                test(Syntax, {});
            },
            (err) =>
                /str required/.test(err.message)
        );
        assert.throws(
            () => {
                test(Syntax, {
                    str: true
                });
            },
            (err) =>
                /str should be string/.test(err.message)
        );
        
        assert.throws(
            () => {
                test(Syntax, {
                    str: "1"
                });
            },
            (err) =>
                /result or error required/.test(err.message)
        );

        assert.throws(
            () => {
                test(false, {
                    str: "1",
                    result: {}
                });
            },
            (err) =>
                /SomeSyntax required/.test(err.message)
        );

        assert.throws(
            () => {
                test({}, {
                    str: "1",
                    result: {}
                });
            },
            (err) =>
                /SomeSyntax should be Syntax constructor/.test(err.message)
        );

        const emptyFunction = () => true;
        emptyFunction();

        assert.throws(
            () => {
                test(emptyFunction, {
                    str: "1",
                    result: {}
                });
            },
            (err) =>
                /SomeSyntax should be Syntax constructor/.test(err.message)
        );
    });

    
    it("testSyntax should call methods: is, parse, toString", () => {
        let hasCallParse = false;
        let hasCallIs = false;
        let hasCallToString = false;

        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String
                };
            }

            is(coach: MyLang) {
                hasCallIs = true;
                return coach.isWord();
            }
            
            parse(coach: MyLang, data: this["TInputData"]) {
                hasCallParse = true;
                data.word = coach.readWord();
            }

            toString() {
                hasCallToString = true;
                return this.data.word;
            }
        }

        class MyLang extends Coach {
            syntax = {
                Word
            };
        }

        function test<
            K extends keyof MyLang["syntax"], 
            TSyntax extends MyLang["syntax"][K]
        >(
            SomeSyntax: TSyntax, 
            inputTest: ITestResult<InstanceType<TSyntax>>,
        ) {
            testSyntax(
                MyLang,
                SomeSyntax, 
                inputTest,
                localIt
            );
        }

        test(Word, {
            str: "hello",
            result: {
                word: "hello"
            }
        });

        assert.ok( hasCallParse );
        assert.ok( hasCallIs );
        assert.ok( hasCallToString );
    });

    
    it("expected error on wrong parsing result", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String
                };
            }

            is(coach: MyLang) {
                return coach.isWord();
            }
            
            parse(coach: MyLang, data: any) {
                data.word = "wrong";
            }

            /* istanbul ignore next */
            toString() {
                return this.data.word;
            }
        }

        class MyLang extends Coach {
            syntax = {
                Word
            };
        }

        function test<
            K extends keyof MyLang["syntax"], 
            TSyntax extends MyLang["syntax"][K]
        >(
            SomeSyntax: TSyntax, 
            inputTest: ITestResult<InstanceType<TSyntax>>,
        ) {
            testSyntax(
                MyLang,
                SomeSyntax, 
                inputTest,
                localIt
            );
        }

        assert.throws(
            () => {
                test(Word, {
                    str: "hello",
                    result: {
                        word: "hello"
                    }
                });
            },
            (err) =>
                err instanceof AssertionError
        );
        
    });

    it("expected error on wrong is", () => {
        class Word extends Syntax<Word> {
            /* istanbul ignore next */
            structure() {
                return {
                    word: Types.String
                };
            }

            is() {
                return false;
            }
            
            /* istanbul ignore next */
            parse(coach: MyLang, data: any) {
                data.word = coach.readWord();
            }

            /* istanbul ignore next */
            toString() {
                return this.data.word;
            }
        }

        class MyLang extends Coach {
            syntax = {
                Word
            };
        }

        function test<
            K extends keyof MyLang["syntax"], 
            TSyntax extends MyLang["syntax"][K]
        >(
            SomeSyntax: TSyntax, 
            inputTest: ITestResult<InstanceType<TSyntax>>,
        ) {
            testSyntax(
                MyLang,
                SomeSyntax, 
                inputTest,
                localIt
            );
        }

        assert.throws(
            () => {
                test(Word, {
                    str: "hello",
                    result: {
                        word: "hello"
                    }
                });
            },
            (err) =>
                err instanceof AssertionError
        );
        
    });
    

    it("expected error on wrong toString", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String
                };
            }

            is(coach: MyLang) {
                return coach.isWord();
            }
            
            parse(coach: MyLang, data: any) {
                data.word = coach.readWord();
            }

            toString() {
                return "";
            }
        }

        class MyLang extends Coach {
            syntax = {
                Word
            };
        }

        function test<
            K extends keyof MyLang["syntax"], 
            TSyntax extends MyLang["syntax"][K]
        >(
            SomeSyntax: TSyntax, 
            inputTest: ITestResult<InstanceType<TSyntax>>,
        ) {
            testSyntax(
                MyLang,
                SomeSyntax, 
                inputTest,
                localIt
            );
        }

        assert.throws(
            () => {
                test(Word, {
                    str: "hello",
                    result: {
                        word: "hello"
                    }
                });
            },
            (err) =>
                err instanceof AssertionError
        );
        
    });
    
    it("expected custom error", () => {
        class Word extends Syntax<Word> {
            /* istanbul ignore next */
            structure() {
                return {
                    word: Types.String
                };
            }

            /* istanbul ignore next */
            is(coach: MyLang) {
                return coach.isWord();
            }
            
            parse(coach: MyLang) {
                coach.throwError("test");
            }

            /* istanbul ignore next */
            toString() {
                return "";
            }
        }

        class MyLang extends Coach {
            syntax = {
                Word
            };
        }

        function test<
            K extends keyof MyLang["syntax"], 
            TSyntax extends MyLang["syntax"][K]
        >(
            SomeSyntax: TSyntax, 
            inputTest: ITestResult<InstanceType<TSyntax>>,
        ) {
            testSyntax(
                MyLang,
                SomeSyntax, 
                inputTest,
                localIt
            );
        }

        let hasCallRegExp = false;
        const regExp = /test/;
        regExp.test = () => {
            hasCallRegExp = true;
            return true;
        };

        test(Word, {
            str: "hello",
            error: regExp
        });

        assert.ok(hasCallRegExp);
    });
    
    it("expected error, if no custom error", () => {
        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String
                };
            }

            /* istanbul ignore next */
            is(coach: MyLang) {
                return coach.isWord();
            }
            
            parse(coach: MyLang, data: any) {
                data.word = coach.readWord();
            }

            /* istanbul ignore next */
            toString() {
                return "";
            }
        }

        class MyLang extends Coach {
            syntax = {
                Word
            };
        }

        function test<
            K extends keyof MyLang["syntax"], 
            TSyntax extends MyLang["syntax"][K]
        >(
            SomeSyntax: TSyntax, 
            inputTest: ITestResult<InstanceType<TSyntax>>,
        ) {
            testSyntax(
                MyLang,
                SomeSyntax, 
                inputTest,
                localIt
            );
        }

        assert.throws(
            () => {
                test(Word, {
                    str: "hello",
                    error: /test/
                });
            },
            (err) => 
                err instanceof AssertionError &&
                /Missing expected exception/.test(err.message)
        );
    });

    it("test.result can be without some props", () => {
        class Some extends Syntax<Some> {
            structure() {
                return {
                    x: Types.String({
                        default: "x"
                    }),
                    y: Types.String({
                        default: "y"
                    }),
                    z: Types.Object({
                        element: Types.Boolean,
                        default: {
                            nice: true
                        }
                    })
                };
            }

            is(coach: MyLang) {
                return true;
            }
            
            parse(coach: MyLang, data: this["TInputData"]) {
                data.x = "x";
                data.y = "y";
                data.z = {nice: true};
            }

            /* istanbul ignore next */
            toString() {
                return "";
            }
        }

        class MyLang extends Coach {
            syntax = {
                Some
            };
        }

        function test<
            K extends keyof MyLang["syntax"], 
            TSyntax extends MyLang["syntax"][K]
        >(
            SomeSyntax: TSyntax, 
            inputTest: ITestResult<InstanceType<TSyntax>>,
        ) {
            testSyntax(
                MyLang,
                SomeSyntax, 
                inputTest,
                localIt
            );
        }

        test(Some, {
            str: "hello",
            result: {}
        });

        test(Some, {
            str: "hello",
            result: {
                x: "x"
            }
        });

        test(Some, {
            str: "hello",
            result: {
                y: "y"
            }
        });

        test(Some, {
            str: "hello",
            result: {
                x: "x",
                y: "y"
            }
        });
        
        test(Some, {
            str: "hello",
            result: {
                z: {nice: true}
            }
        });

        assert.throws(
            () => {
                test(Some, {
                    str: "hello",
                    result: {
                        z: {nice: false}
                    }
                });
            },
            (err) =>
                err instanceof AssertionError
        );

        assert.throws(
            () => {
                test(Some, {
                    str: "hello",
                    result: {
                        x: "y"
                    }
                });
            },
            (err) =>
                err instanceof AssertionError
        );
    });

    it("testSyntax with options should call methods: is, parse  with same options", () => {
        let callParseOptions: any = null;
        let callIsOptions: any = null;

        class Word extends Syntax<Word> {
            structure() {
                return {
                    word: Types.String
                };
            }

            is(coach: MyLang, str: string, options) {
                callIsOptions = options;
                return coach.isWord();
            }
            
            parse(coach: MyLang, data: this["TInputData"], options) {
                callParseOptions = options;
                data.word = coach.readWord();
            }

            toString() {
                return this.data.word;
            }
        }

        class MyLang extends Coach {
            syntax = {
                Word
            };
        }

        function test<
            K extends keyof MyLang["syntax"], 
            TSyntax extends MyLang["syntax"][K]
        >(
            SomeSyntax: TSyntax, 
            inputTest: ITestResult<InstanceType<TSyntax>>,
        ) {
            testSyntax(
                MyLang,
                SomeSyntax, 
                inputTest,
                localIt
            );
        }

        test(Word, {
            str: "hello",
            options: {
                test: true
            },
            result: {
                word: "hello"
            }
        });

        assert.deepStrictEqual(callParseOptions, {test: true});
        assert.deepStrictEqual(callIsOptions, {test: true});
    });
    
});
