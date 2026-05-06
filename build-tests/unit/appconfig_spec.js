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
        it("writes the merged config (with environment field) to Resources/app-config.json", function (done) {
            sinon.stub(fs, "existsSync").returns(true);
            sinon.stub(fs, "readFileSync").returns('{"cerdiServerUrl":"x"}');
            const writeStub = sinon.stub(fs, "writeFileSync");

            const data = { projectDir: "/project" };
            copyBuildConfig(data, function () {
                expect(writeStub.calledOnce).to.be.true;
                expect(writeStub.firstCall.args[0]).to.include("app-config.json");
                expect(JSON.parse(writeStub.firstCall.args[1])).to.deep.equal({
                    cerdiServerUrl: "x",
                    environment: "mock",
                });
                done();
            });
        });

        it("should fail with an error when the config file does not exist", function (done) {
            sinon.stub(fs, "existsSync").returns(false);
            const writeStub = sinon.stub(fs, "writeFileSync");

            const data = { projectDir: "/project" };
            copyBuildConfig(data, function (err) {
                expect(writeStub.called).to.be.false;
                expect(err).to.be.an.instanceOf(Error);
                expect(err.message).to.include("app-config.mock.json");
                done();
            });
        });
    });
});
