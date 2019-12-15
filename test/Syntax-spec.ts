
import assert from "assert";
import {Syntax} from "../lib/Syntax";

describe("Coach tests", () => {
    
    it("default behavior for static method Syntax.parse", () => {

        class SomeSyntax extends Syntax<SomeSyntax> {
            structure() {
                return {};
            }
        }
        class AnotherSyntax extends Syntax<AnotherSyntax> {
            structure() {
                return {};
            }
        }

        assert.throws(
            () => {
                (new SomeSyntax() as any).parse();
            }, 
            (err) =>
                err.message === "static SomeSyntax.parse(coach, options) is not declared"
        );

        assert.throws(
            () => {
                (new AnotherSyntax() as any).parse();
            }, 
            (err) =>
                err.message === "static AnotherSyntax.parse(coach, options) is not declared"
        );
    });

    it("default behavior for static method Syntax.is", () => {

        class SomeSyntax extends Syntax<SomeSyntax> {
            structure() {
                return {};
            }
        }
        class AnotherSyntax extends Syntax<AnotherSyntax> {
            structure() {
                return {};
            }
        }

        assert.throws(
            () => {
                (new SomeSyntax() as any).is();
            }, 
            (err) =>
                err.message === "static SomeSyntax.is(coach, options) is not declared"
        );

        assert.throws(
            () => {
                (new AnotherSyntax() as any).is();
            }, 
            (err) =>
                err.message === "static AnotherSyntax.is(coach, options) is not declared"
        );
    });

    it("default behavior for method Syntax.toString(options)", () => {

        class SomeSyntax extends Syntax<SomeSyntax> {
            structure() {
                return {};
            }
        }
        class AnotherSyntax extends Syntax<AnotherSyntax> {
            structure() {
                return {};
            }
        }

        assert.throws(
            () => {
                new SomeSyntax().toString();
            }, 
            (err) =>
                err.message === "SomeSyntax.toString(options) is not declared"
        );

        assert.throws(
            () => {
                new AnotherSyntax().toString();
            }, 
            (err) =>
                err.message === "AnotherSyntax.toString(options) is not declared"
        );
    });

});
