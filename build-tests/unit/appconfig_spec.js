import { createRequire } from "module";
import { expect } from "chai";
import sinon from "sinon";

const require = createRequire(import.meta.url);
const hook = require("../../plugins/unittest/1.0/hooks/appconfig");
const fs = require("fs");

describe("appconfig hook", function () {
    let doConfig;
    let copyBuildConfig;
    let cli;

    beforeEach(function () {
        cli = {
            argv: { "app-config": "mock" },
            addHook: (_event, options) => {
                if (_event === 'build.config') doConfig = options;
                if (_event === 'build.pre.compile') copyBuildConfig = options.post;
            }
        };
        hook.init({}, {}, cli);
    });

    afterEach(function () {
        sinon.restore();
    });

    describe("build.config hook", function () {
        it("should register the app-config option with expected values", function (done) {
            const data = { result: [null, { flags: {}, options: {} }] };
            doConfig(data, function () {
                const opt = data.result[1].options["app-config"];
                expect(opt).to.exist;
                expect(opt.values).to.deep.equal(["test", "production", "mock", "mitm"]);
                expect(opt.default).to.equal("test");
                done();
            });
        });

        it("should initialise flags if missing", function (done) {
            const data = { result: [null, { options: {} }] };
            doConfig(data, function () {
                expect(data.result[1].flags).to.deep.equal({});
                done();
            });
        });
    });

    describe("build.pre.compile hook", function () {
        it("should copy the config file when it exists", function (done) {
            sinon.stub(fs, "existsSync").returns(true);
            const copyStub = sinon.stub(fs, "copyFileSync");

            const data = { projectDir: "/project" };
            copyBuildConfig(data, function () {
                expect(copyStub.calledOnce).to.be.true;
                expect(copyStub.firstCall.args[0]).to.include("app-config.mock.json");
                expect(copyStub.firstCall.args[1]).to.include("app-config.json");
                done();
            });
        });

        it("should skip the copy when the config file does not exist", function (done) {
            sinon.stub(fs, "existsSync").returns(false);
            const copyStub = sinon.stub(fs, "copyFileSync");

            const data = { projectDir: "/project" };
            copyBuildConfig(data, function () {
                expect(copyStub.called).to.be.false;
                done();
            });
        });
    });
});
