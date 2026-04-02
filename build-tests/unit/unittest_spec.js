import { createRequire } from "module";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";

const require = createRequire(import.meta.url);
const hook = require("../../plugins/unittest/1.0/hooks/unittest");

describe("unittest hook", function () {
    let doConfig;
    let preCompile;
    let cli;

    beforeEach(function () {
        cli = {
            argv: {},
            on: (event, options) => {
                if (event === 'build.ios.config') doConfig = options;
                if (event === 'build.pre.compile' && options.pre) preCompile = options.pre;
            }
        };
        hook.init({ info: () => {} }, {}, cli);
    });

    afterEach(function () {
        sinon.restore();
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

    describe("build.pre.compile hook", function () {
        const projectDir = "/project";

        beforeEach(function () {
            cli.argv['project-dir'] = projectDir;
            sinon.stub(fs, 'symlinkSync');
            sinon.stub(fs, 'unlinkSync');
        });

        it("should create app/lib/spec symlink when --unit-test is set", function (done) {
            cli.argv["unit-test"] = true;
            preCompile({}, function () {
                expect(fs.symlinkSync.calledWith('../spec', `${projectDir}/app/lib/spec`)).to.be.true;
                done();
            });
        });

        it("should symlink index.js to index-app.js when --unit-test is not set", function (done) {
            cli.argv["unit-test"] = false;
            preCompile({}, function () {
                expect(fs.symlinkSync.calledWith('index-app.js', `${projectDir}/app/controllers/index.js`)).to.be.true;
                done();
            });
        });

        it("should remove any existing symlink before creating a new one", function (done) {
            cli.argv["unit-test"] = true;
            preCompile({}, function () {
                expect(fs.unlinkSync.calledWith(`${projectDir}/app/lib/spec`)).to.be.true;
                expect(fs.unlinkSync.calledBefore(fs.symlinkSync)).to.be.true;
                done();
            });
        });

        it("should remove existing symlink on normal builds to keep specs out", function (done) {
            cli.argv["unit-test"] = false;
            preCompile({}, function () {
                expect(fs.unlinkSync.calledWith(`${projectDir}/app/lib/spec`)).to.be.true;
                done();
            });
        });

        it("should not throw if no symlink exists to remove", function (done) {
            fs.unlinkSync.throws(new Error('ENOENT'));
            cli.argv["unit-test"] = true;
            expect(() => preCompile({}, done)).to.not.throw();
        });
    });
});
