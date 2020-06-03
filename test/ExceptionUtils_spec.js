require("mocha");
const { expect } = require("chai");
const { parseStackTrace } = require("../walta-app/app/lib/util/ExceptionUtils");
describe('ExceptionUtils', function() {
    it('should parse a stack frame', function() {
        const testFrame = `require@[native code]\nfile:///var/containers/Bundle/Application/2D13F357-8F8B-4797-93AB-8A1C6E4178D9/Waterbug.app/ti.main.js:13057:10
loadAsync@file:///var/containers/Bundle/Application/2D13F357-8F8B-4797-93AB-8A1C6E4178D9/Waterbug.app/ti.main.js:12985:13`;
        const result = parseStackTrace(testFrame);
        expect( result ).to.be.an('array');
        expect( result ).to.have.lengthOf(3);
        expect( result ).to.deep.equals([
            {
                symbol: "require",
                file: "[native code]"
            },
            {
                symbol: undefined,
                file: "file:///var/containers/Bundle/Application/2D13F357-8F8B-4797-93AB-8A1C6E4178D9/Waterbug.app/ti.main.js",
                line: 13057,
                column: 10
            }, 
            {
                symbol: "loadAsync",
                file: "file:///var/containers/Bundle/Application/2D13F357-8F8B-4797-93AB-8A1C6E4178D9/Waterbug.app/ti.main.js",
                line: 12985,
                column: 13
            }
        ]);
    });
});