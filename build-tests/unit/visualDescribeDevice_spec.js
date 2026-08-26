import { expect } from "chai";
import IosSimulatorLauncher from "../../build-utils/IosSimulatorLauncher.js";
import AndroidLauncher from "../../build-utils/AndroidLauncher.js";

// A capture run is labelled by whatever --device the person running it typed
// ("local" by default), which says nothing about what actually rendered it. The
// launcher knows, so the run records it and the report names it.
describe("visual run device identity", function () {
    it("names the iOS simulator the captures were rendered on", async function () {
        const execFile = (cmd, args, opts, cb) => cb(null, JSON.stringify({
            devices: {
                "com.apple.CoreSimulator.SimRuntime.iOS-26-3": [
                    { udid: "OTHER-UDID", name: "iPhone 16" },
                    { udid: "THE-UDID", name: "iPhone 17 Pro" },
                ],
            },
        }), "");
        const launcher = new IosSimulatorLauncher({ execFile, udid: "THE-UDID" });
        expect(await launcher.describeDevice()).to.equal("iPhone 17 Pro · iOS 26.3");
    });

    it("names the Android device the captures were rendered on", async function () {
        const props = { "ro.product.model": "sdk_gphone64_arm64", "ro.build.version.release": "14" };
        const execFile = (cmd, args, cb) => {
            const prop = args[args.length - 1];
            cb(null, prop in props ? props[prop] + "\n" : "device\n");
        };
        const launcher = new AndroidLauncher({ execFile });
        expect(await launcher.describeDevice()).to.equal("sdk_gphone64_arm64 · Android 14");
    });
});
