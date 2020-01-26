
import {Syntax} from "../lib/Syntax";
import {Coach} from "../lib/Coach";
import assert from "assert";

export interface ITestResult<SomeSyntax extends Syntax<any>> {
    // string for parsing
    str: string;
    // Syntax options
    options?: SomeSyntax["IOptions"];
    // parsing result
    result?: SomeSyntax["TInputData"];
    // or expected error on parsing
    error?: RegExp;
}

export function testSyntax<
    TCoach extends new (...args: any) => Coach,
    K extends keyof InstanceType<TCoach>["syntax"], 
    TSyntax extends InstanceType<TCoach>["syntax"][K]
>(
    SomeCoach: TCoach,
    SomeSyntax: TSyntax, 
    inputTest: ITestResult<InstanceType<TSyntax>>,
    it?: (name: string, handler: () => void) => void
) {
    /* istanbul ignore next */
    if ( it == null ) {
        it = global.it;
    }

    const testAny = inputTest as any;

    if ( !("str" in testAny) ) {
        throw new Error("str required");
    }
    if ( typeof testAny.str !== "string" ) {
        throw new Error("str should be string");
    }

    if ( !testAny.result && !testAny.error ) {
        throw new Error("result or error required");
    }
    
    if ( !SomeSyntax ) {
        throw new Error("SomeSyntax required");
    }

    if ( typeof SomeSyntax !== "function" || !(SomeSyntax.prototype instanceof Syntax) ) {
        throw new Error("SomeSyntax should be Syntax constructor");
    }

    const str = testAny.str;

    if ( testAny.error ) {
        const test = testAny as ITestResult<InstanceType<TSyntax>>;
        const regExp = test.error;

        it(`expected error:\n ${regExp}\nstring:\n${str}`, () => {
            
            assert.throws(
                () => {
                    const coach = new SomeCoach(str);
                    coach.parse(SomeSyntax);
                },
                (err) =>
                    regExp.test( err )
            );
        });
    }
    else {
        const test = testAny as ITestResult<InstanceType<TSyntax>>;

        it(`testing method coach.is(${ SomeSyntax.name })\n string:\n${str}`, () => {

            const coach = new SomeCoach(str);
            const result = coach.is(SomeSyntax, test.options);
            assert.ok( result );
        });


        it(`testing method coach.parse(${ SomeSyntax.name })\n string:\n${str}`, () => {
            
            const coach = new SomeCoach(str);
            const result = coach.parse(SomeSyntax, test.options);
            assert.deepEqual(test.result, result.toJSON());
        });


        it(`testing method ${ SomeSyntax.name }.toString()\n string:\n${str}`, () => {
            
            const coach = new SomeCoach(str);
            const result = coach.parse(SomeSyntax, test.options);
            const clone = result.clone();
            const cloneString = clone.toString();
            const cloneCoach = new SomeCoach( cloneString );
            
            const cloneResult = cloneCoach.parse(SomeSyntax, test.options);
            assert.deepEqual(test.result, cloneResult.toJSON());
        });
    }

}
