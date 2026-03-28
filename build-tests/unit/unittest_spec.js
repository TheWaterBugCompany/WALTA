import { createRequire } from "module";
import { expect } from "chai";

const require = createRequire(import.meta.url);
const hook = require("../../plugins/unittest/1.0/hooks/unittest");

describe("unittest hook", function () {
    let doConfig;
    let copyResource;
    let cli;

    beforeEach(function () {
        cli = {
            argv: {},
            on: (event, options) => {
                if (event === 'build.ios.config') doConfig = options;
                if (event === 'build.ios.copyResource') copyResource = options.pre;
            }
        };
        hook.init({ info: () => {} }, {}, cli);
    });

    describe("build.*.config hook", function () {
        it("should register the unit-test flag", function (done) {
            const data = { result: [null, { flags: {}, options: {} }] };
            doConfig(data, function () {
                expect(data.result[1].flags["unit-test"]).to.exist;
                expect(data.result[1].flags["unit-test"].default).to.be.false;
                done();
            });
        });

        it("should initialise flags if missing", function (done) {
            const data = { result: [null, { options: {} }] };
            doConfig(data, function () {
                expect(data.result[1].flags["unit-test"]).to.exist;
                done();
            });
        });
    });

    describe("build.*.copyResource hook", function () {
        const projectDir = "/project";

        it("should replace index.js with UnitTest.js when --unit-test is set", function (done) {
            cli.argv["unit-test"] = true;
            const resourcesDir = `${projectDir}/Resources`;
            const data = { args: [`${resourcesDir}/alloy/controllers/index.js`] };
            copyResource.call({ projectDir }, data, function () {
                expect(data.args[0]).to.match(/UnitTest\.js$/);
                done();
            });
        });

        it("should leave the file path unchanged when --unit-test is not set", function (done) {
            cli.argv["unit-test"] = false;
            const resourcesDir = `${projectDir}/Resources`;
            const original = `${resourcesDir}/alloy/controllers/index.js`;
            const data = { args: [original] };
            copyResource.call({ projectDir }, data, function () {
                expect(data.args[0]).to.equal(original);
                done();
            });
        });

        it("should leave non-index files unchanged even when --unit-test is set", function (done) {
            cli.argv["unit-test"] = true;
            const resourcesDir = `${projectDir}/Resources`;
            const original = `${resourcesDir}/alloy/controllers/Main.js`;
            const data = { args: [original] };
            copyResource.call({ projectDir }, data, function () {
                expect(data.args[0]).to.equal(original);
                done();
            });
        });
    });
});
