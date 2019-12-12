import {Model} from "model-layer";

export class Syntax<TSyntax extends Syntax<any>> extends Model<TSyntax> {
    
    static parse(coach, data, options) {
        throw new Error(`static ${ this.name }.parse(coach, options) is not declared`);
    }

    static is(coach, str, options) {
        throw new Error(`static ${ this.name }.is(coach, options) is not declared`);
    }

    toString(options?) {
        throw new Error(`${ this.constructor.name }.toString(options) is not declared`);
    }
}
