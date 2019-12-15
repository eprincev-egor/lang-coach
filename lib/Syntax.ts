import {Model} from "model-layer";
import {Coach} from "./Coach";

interface IAnyObject {
    [key: string]: any;
}

interface ISyntax extends Model<any> {
    parse(coach: Coach, data: IAnyObject, options?: IAnyObject): void;
    is(coach: Coach, str: string, options?: IAnyObject): boolean;
    toString(options?: IAnyObject): string;
}

export abstract class Syntax<TSyntax extends Syntax<any>> extends Model<TSyntax> implements ISyntax {
    
    parse(coach: Coach, data: IAnyObject, options?: IAnyObject): void {
        throw new Error(`static ${ this.constructor.name }.parse(coach, options) is not declared`);
    }

    is(coach: Coach, str: string, options?: IAnyObject): boolean {
        throw new Error(`static ${ this.constructor.name }.is(coach, options) is not declared`);
    }

    toString(options?: IAnyObject): string {
        throw new Error(`${ this.constructor.name }.toString(options) is not declared`);
    }
}
