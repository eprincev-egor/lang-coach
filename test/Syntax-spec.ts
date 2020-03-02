
import assert from "assert";
import {Syntax} from "../lib/Syntax";

describe("Coach tests", () => {
    
    it("default behavior for method method Syntax.parse", () => {

        class SomeSyntax extends (Syntax as any) {
            structure() {
                return {};
            }
        }
        class AnotherSyntax extends (Syntax as any) {
            structure() {
                return {};
            }
        }

        assert.throws(
            () => {
                (new SomeSyntax() as any).parse();
            }, 
            (err) =>
                err.message === "method SomeSyntax.parse(coach, data, options) is not declared"
        );

        assert.throws(
            () => {
                (new AnotherSyntax() as any).parse();
            }, 
            (err) =>
                err.message === "method AnotherSyntax.parse(coach, data, options) is not declared"
        );
    });

    it("default behavior for method method Syntax.is", () => {

        class SomeSyntax extends (Syntax as any) {
            structure() {
                return {};
            }
        }
        class AnotherSyntax extends (Syntax as any) {
            structure() {
                return {};
            }
        }

        assert.throws(
            () => {
                (new SomeSyntax() as any).is();
            }, 
            (err) =>
                err.message === "method SomeSyntax.is(coach, str, options) is not declared"
        );

        assert.throws(
            () => {
                (new AnotherSyntax() as any).is();
            }, 
            (err) =>
                err.message === "method AnotherSyntax.is(coach, str, options) is not declared"
        );
    });

    it("default behavior for method Syntax.toString(options)", () => {

        class SomeSyntax extends (Syntax as any) {
            structure() {
                return {};
            }
        }
        class AnotherSyntax extends (Syntax as any) {
            structure() {
                return {};
            }
        }

        assert.throws(
            () => {
                new SomeSyntax().toString();
            }, 
            (err) =>
                err.message === "method SomeSyntax.toString(options) is not declared"
        );

        assert.throws(
            () => {
                new AnotherSyntax().toString();
            }, 
            (err) =>
                err.message === "method AnotherSyntax.toString(options) is not declared"
        );
    });

});
