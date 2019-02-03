"use strict";

const {Model} = require("model-layer");

class Syntax extends Model {

    static parse(coach, options) {
        // for eslint
        coach;
        options;

        throw new Error(`static ${ this.name }.parse(coach, options) is not declared`);
    }

    static is(coach, options) {
        // for eslint
        coach;
        options;

        throw new Error(`static ${ this.name }.is(coach, options) is not declared`);
    }

    toString(options) {
        // for eslint
        options;

        throw new Error(`${ this.constructor.name }.toString(options) is not declared`);
    }
}

module.exports = Syntax;