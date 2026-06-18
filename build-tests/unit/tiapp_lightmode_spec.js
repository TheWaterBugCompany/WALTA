import { createRequire } from "module";
import { expect } from "chai";

const require = createRequire(import.meta.url);
const fs = require("fs");
const path = require("path");

// The app has no dark palette; on a dark-mode device system controls draw
// white-on-white and vanish (WB-165 date picker, WB-170 survey-complete switch).
// Pin the whole iOS app to light mode in the Info.plist rather than per-screen.
describe("tiapp.xml.template iOS interface style", function () {
    it("forces the iOS app to light mode", function () {
        const template = fs.readFileSync(
            path.join(import.meta.dirname, "../../walta-app/tiapp.xml.template"),
            "utf8"
        );
        expect(template).to.match(
            /<key>UIUserInterfaceStyle<\/key>\s*<string>Light<\/string>/
        );
    });
});
