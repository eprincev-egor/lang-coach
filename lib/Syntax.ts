import {Model} from "model-layer";
import {Coach} from "./Coach";

interface IAnyObject {
    [key: string]: any;
}

interface ISyntax extends Model<any> {
    IOptions: {
        [key: string]: any;
    };
    parse(coach: Coach, data: this["TInputData"], options?: this["IOptions"]): void;
    is(coach: Coach, str: string, options?: this["IOptions"]): boolean;
    toString(options?: IAnyObject): string;
}

export abstract class Syntax<TSyntax extends Syntax<any>> extends Model<TSyntax> implements ISyntax {
    syntax: Coach["syntax"];
    IOptions: {
        [key: string]: any;
    };

    parse(coach: Coach, data: this["TInputData"], options?: this["IOptions"]): void {
        throw new Error(`static ${ this.constructor.name }.parse(coach, options) is not declared`);
    }

    is(coach: Coach, str: string, options?: this["IOptions"]): boolean {
        throw new Error(`static ${ this.constructor.name }.is(coach, options) is not declared`);
    }

    toString(options?: IAnyObject): string {
        throw new Error(`${ this.constructor.name }.toString(options) is not declared`);
    }
}
