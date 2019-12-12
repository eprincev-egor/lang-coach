import {Syntax, Coach} from "../lib/index";
import assert from "assert";

describe("index tests", () => {
    
    it("index has Syntax and Coach", () => {

        assert.ok( Syntax );
        assert.ok( Coach );

    });

});