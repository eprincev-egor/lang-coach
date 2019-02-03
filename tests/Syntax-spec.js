"use strict";

const assert = require("assert");
const Syntax = require("../lib/Syntax");

describe("Coach tests", () => {
    
    it("default behavior for static method Syntax.parse", () => {

        class SomeSyntax extends Syntax {}
        class AnotherSyntax extends Syntax {}

        assert.throws(
            () => {
                SomeSyntax.parse();
            }, 
            err =>
                err.message == "static SomeSyntax.parse(coach, options) is not declared"
        );

        assert.throws(
            () => {
                AnotherSyntax.parse();
            }, 
            err =>
                err.message == "static AnotherSyntax.parse(coach, options) is not declared"
        );
    });

    it("default behavior for static method Syntax.is", () => {

        class SomeSyntax extends Syntax {}
        class AnotherSyntax extends Syntax {}

        assert.throws(
            () => {
                SomeSyntax.is();
            }, 
            err =>
                err.message == "static SomeSyntax.is(coach, options) is not declared"
        );

        assert.throws(
            () => {
                AnotherSyntax.is();
            }, 
            err =>
                err.message == "static AnotherSyntax.is(coach, options) is not declared"
        );
    });

    it("default behavior for method Syntax.toString(options)", () => {

        class SomeSyntax extends Syntax {
            static structure() {
                return {};
            }
        }
        class AnotherSyntax extends Syntax {
            static structure() {
                return {};
            }
        }

        assert.throws(
            () => {
                new SomeSyntax().toString();
            }, 
            err =>
                err.message == "SomeSyntax.toString(options) is not declared"
        );

        assert.throws(
            () => {
                new AnotherSyntax().toString();
            }, 
            err =>
                err.message == "AnotherSyntax.toString(options) is not declared"
        );
    });

});