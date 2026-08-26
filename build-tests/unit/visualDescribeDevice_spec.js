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

    // Two Android legs can run the same emulator image at different screen
    // profiles, so the model alone reads identically for both — the geometry is
    // what actually distinguishes them, and it is what the baselines key on.
    it("names the Android device and the geometry that distinguishes its profile", async function () {
        const responses = {
            "shell getprop ro.product.model": "sdk_gphone64_arm64",
            "shell getprop ro.build.version.release": "14",
            "shell wm size": "Physical size: 1080x2400",
            "shell wm density": "Physical density: 420",
        };
        const execFile = (cmd, args, cb) => cb(null, (responses[args.join(" ")] || "") + "\n");
        const launcher = new AndroidLauncher({ execFile });
        expect(await launcher.describeDevice())
            .to.equal("sdk_gphone64_arm64 · Android 14 · 1080x2400 @420dpi");
    });

    it("reports an overridden screen size rather than the physical one", async function () {
        const responses = {
            "shell getprop ro.product.model": "sdk_gphone64_arm64",
            "shell getprop ro.build.version.release": "14",
            "shell wm size": "Physical size: 1080x2400\nOverride size: 1080x1920",
            "shell wm density": "Physical density: 420\nOverride density: 480",
        };
        const execFile = (cmd, args, cb) => cb(null, (responses[args.join(" ")] || "") + "\n");
        const launcher = new AndroidLauncher({ execFile });
        expect(await launcher.describeDevice())
            .to.equal("sdk_gphone64_arm64 · Android 14 · 1080x1920 @480dpi");
    });
});
