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

export abstract class Syntax<TSyntax extends Syntax<any>>
extends Model<TSyntax>
implements ISyntax {
    protected syntax!: Coach["syntax"];

    abstract parse(coach: Coach, data: IAnyObject, options?: IAnyObject): void;
    abstract is(coach: Coach, str: string, options?: IAnyObject): boolean;
    abstract toString(options?: IAnyObject): string;
}


(() => {
    const syntaxProto = (Syntax as any).prototype;

    syntaxProto.parse = function parse(coach: Coach, data: IAnyObject, options?: IAnyObject): void {
        throw new Error(`method ${ this.constructor.name }.parse(coach, data, options) is not declared`);
    };

    syntaxProto.is = function is(coach: Coach, str: string, options?: IAnyObject): boolean {
        throw new Error(`method ${ this.constructor.name }.is(coach, str, options) is not declared`);
    };

    syntaxProto.toString = function toString(options?: IAnyObject): string {
        throw new Error(`method ${ this.constructor.name }.toString(options) is not declared`);
    };

})();
