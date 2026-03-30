import { createRequire } from "module";
import { expect } from "chai";
import sinon from "sinon";

const require = createRequire(import.meta.url);
const hook = require("../../plugins/unittest/1.0/hooks/transpilefix");
const fsExtra = require("fs-extra");

describe("transpilefix hook", function () {
    let compileJsFile;
    let cli;

    beforeEach(function () {
        const hooks = {};
        cli = {
            addHook: (event, options) => { hooks[event] = options.pre; }
        };
        hook.init({ info: () => {} }, {}, cli);
        // Both iOS and Android register the same function — grab either
        compileJsFile = hooks["build.ios.compileJsFile"];
    });

    afterEach(function () {
        sinon.restore();
    });

    describe("when the file is mocha.js", function () {
        it("should delete data.fn to skip transpilation", async function () {
            sinon.stub(fsExtra, "ensureDir").resolves();
            sinon.stub(fsExtra, "writeFile").resolves();

            const data = {
                args: [{ contents: "/* mocha */" }, "spec/lib/mocha.js", "/build/mocha.js"],
                fn: () => {}
            };
            await compileJsFile(data);
            expect(data.fn).to.be.undefined;
        });

        it("should write the file contents directly to the destination", async function () {
            sinon.stub(fsExtra, "ensureDir").resolves();
            const writeStub = sinon.stub(fsExtra, "writeFile").resolves();

            const data = {
                args: [{ contents: "/* mocha */" }, "spec/lib/mocha.js", "/build/mocha.js"],
                fn: () => {}
            };
            await compileJsFile(data);
            expect(writeStub.calledWith("/build/mocha.js", "/* mocha */")).to.be.true;
        });
    });

    describe("when the file is not mocha.js", function () {
        it("should leave data unchanged", async function () {
            sinon.stub(fsExtra, "ensureDir").resolves();
            const writeStub = sinon.stub(fsExtra, "writeFile").resolves();

            const originalFn = () => {};
            const data = {
                args: [{ contents: "/* app code */" }, "app/controllers/index.js", "/build/index.js"],
                fn: originalFn
            };
            await compileJsFile(data);
            expect(data.fn).to.equal(originalFn);
            expect(writeStub.called).to.be.false;
        });
    });
});
