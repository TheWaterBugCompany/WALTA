import { createRequire } from "module";
import { expect } from "chai";

const require = createRequire(import.meta.url);
const hook = require("../../plugins/unittest/1.0/hooks/hackliveview");

describe("hackliveview hook", function () {
    let hookFn;
    let cli;

    beforeEach(function () {
        cli = {
            argv: { liveview: true },
            addHook: (_event, options) => { hookFn = options.pre; }
        };
        hook.init({}, {}, cli);
    });

    it("should disable LiveView when the hook fires", function (done) {
        hookFn({}, function () {
            expect(cli.argv.liveview).to.be.false;
            done();
        });
    });
});
