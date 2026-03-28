import { createRequire } from "module";
import { expect } from "chai";

const require = createRequire(import.meta.url);
const hook = require("../../plugins/unittest/1.0/hooks/stripsimincompatiblemodules");

describe("stripsimincompatiblemodules hook", function () {
    let stripModules;
    let logMessages;

    beforeEach(function () {
        logMessages = [];
        const logger = { info: (msg) => logMessages.push(msg) };
        const cli = {
            addHook: (_event, options) => { stripModules = options.post; }
        };
        hook.init(logger, {}, cli);
    });

    describe("non-simulator target", function () {
        it("should leave modules untouched", function (done) {
            const data = {
                target: 'device',
                modules: [{ id: 'be.aca.mobile.bugfender' }],
                tiapp: { modules: [{ id: 'be.aca.mobile.bugfender' }] }
            };
            stripModules(data, function () {
                expect(data.modules).to.have.lengthOf(1);
                done();
            });
        });
    });

    describe("simulator target", function () {
        it("should strip incompatible modules from data.modules", function (done) {
            const data = {
                target: 'simulator',
                modules: [
                    { id: 'be.aca.mobile.bugfender' },
                    { id: 'some.compatible.module' }
                ],
                tiapp: { modules: [] }
            };
            stripModules(data, function () {
                expect(data.modules.map(m => m.id)).to.deep.equal(['some.compatible.module']);
                done();
            });
        });

        it("should remove incompatible modules from data.legacyModules Set", function (done) {
            const data = {
                target: 'simulator',
                modules: [],
                legacyModules: new Set(['be.aca.mobile.bugfender', 'some.compatible.module']),
                tiapp: { modules: [] }
            };
            stripModules(data, function () {
                expect(data.legacyModules.has('be.aca.mobile.bugfender')).to.be.false;
                expect(data.legacyModules.has('some.compatible.module')).to.be.true;
                done();
            });
        });

        it("should strip incompatible modules from data.tiapp.modules", function (done) {
            const data = {
                target: 'simulator',
                modules: [],
                tiapp: {
                    modules: [
                        { id: 'be.aca.mobile.bugfender' },
                        { id: 'some.compatible.module' }
                    ]
                }
            };
            stripModules(data, function () {
                expect(data.tiapp.modules.map(m => m.id)).to.deep.equal(['some.compatible.module']);
                done();
            });
        });

        it("should strip incompatible modules from data.nativeLibModules", function (done) {
            const data = {
                target: 'simulator',
                modules: [],
                nativeLibModules: [
                    { id: 'be.aca.mobile.bugfender' },
                    { id: 'some.compatible.module' }
                ],
                tiapp: { modules: [] }
            };
            stripModules(data, function () {
                expect(data.nativeLibModules.map(m => m.id)).to.deep.equal(['some.compatible.module']);
                done();
            });
        });

        it("should log which modules were stripped", function (done) {
            const data = {
                target: 'simulator',
                modules: [{ id: 'be.aca.mobile.bugfender' }],
                tiapp: { modules: [] }
            };
            stripModules(data, function () {
                expect(logMessages[0]).to.include('be.aca.mobile.bugfender');
                done();
            });
        });
    });
});
