import { createRequire } from "module";
import { expect } from "chai";
import sinon from "sinon";

const require = createRequire(import.meta.url);
const hook = require("../../plugins/unittest/1.0/hooks/appconfig");
const fs = require("fs");

describe("appconfig hook", function () {
    let copyBuildConfig;
    let cli;

    beforeEach(function () {
        cli = {
            argv: { "app-config": "mock" },
            addHook: (_event, options) => {
                if (_event === 'build.pre.compile') copyBuildConfig = options.post;
            }
        };
        hook.init({}, {}, cli);
    });

    afterEach(function () {
        sinon.restore();
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
