require("mocha");
const { expect } = require("chai");
const { decodeSyslog } = require("../features/support/ios-colors");
describe.only( "decodeSyslog", function() {
    it("decode a syslog-encoded line", function() {
        const decoded = decodeSyslog(String.raw`\134^[[32m    +\134^[[0m\134^[[90m should open a map viewer when location icon is clicked \134^[[0m`);
        expect(decoded).to.equal('\u001b[32m    +\u001b[0m\u001b[90m should open a map viewer when location icon is clicked \u001b[0m');
    });
});