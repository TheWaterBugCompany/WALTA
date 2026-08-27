import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { collectHandshake } from "../../build-utils/visual/collectHandshake.js";
import runner from "../../walta-app/app/spec/visual/handshake.js";

// The two halves of the visual-capture handshake, run against each other over a
// real directory: the device runner's half (walta-app/app/spec/visual/handshake)
// and the host collector's half (build-utils/visual/collectHandshake).
//
// Each half is sound alone, and the fault WB-291 shipped lived only in the gap
// between them — the host screenshotting a screen the runner had already walked
// past, and writing it under the earlier screen's name. Nothing but a test that
// drives both can see that, so this is where the protocol's central invariant
// belongs: a capture always holds the screen its filename claims.
describe("visual capture handshake", function () {
    let dir, actualDir;

    beforeEach(function () {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), "walta-handshake-"));
        dir = path.join(root, "visual");
        actualDir = path.join(root, "actual");
        fs.mkdirSync(dir);
        fs.mkdirSync(actualDir);
    });

    // The runner's port onto its visual dir — Ti.Filesystem on the device.
    function devicePort() {
        return {
            exists: (name) => fs.existsSync(path.join(dir, name)),
            write: (name) => fs.writeFileSync(path.join(dir, name), ""),
            sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
        };
    }

    // The host's port onto the same dir. `blindPolls` models the real failure
    // condition: on a contended CI runner the host's view of the app container
    // took ~199s to become readable while the app was already opening screens.
    // It blinds reads *and* writes, because a container the host cannot resolve
    // is one it can neither list nor drop an ack into.
    //
    // Every screenshot records which screen was *actually* on the device when the
    // grab happened, so a capture written under the wrong name is visible.
    function hostLauncher(live, { blindPolls = 0 } = {}) {
        const grabs = [];
        let reaches = 0;
        // Every touch of the container counts, so a host blinded on its first
        // touch still makes progress towards seeing it.
        const reachContainer = () => {
            if (reaches++ < blindPolls) { throw new Error("no such container"); }
        };
        return {
            grabs,
            async listVisualCaptureFiles() {
                reachContainer();
                return fs.readdirSync(dir);
            },
            async screenshotFramebuffer(destPath) {
                grabs.push({ named: path.basename(destPath, ".png"), held: live.screen });
                fs.writeFileSync(destPath, "");
            },
            async writeVisualCaptureFile(appId, name) {
                reachContainer();
                fs.writeFileSync(path.join(dir, name), "");
            },
        };
    }

    // The runner's capture loop, stripped to the handshake: open a screen, hold it
    // until the host has shot it, move on.
    async function runCapture(screens, live) {
        const port = devicePort();
        for (const screen of screens) {
            live.screen = screen;
            await runner.holdUntilShot(port, screen, { pollMs: 5 });
        }
        runner.signalDone(port);
    }

    function collect(launcher) {
        return collectHandshake({
            launcher, appId: "app", actualDir, timeoutMs: 10000, pollMs: 5,
            looksBlank: async () => false,
        });
    }

    const SCREENS = ["Menu", "MethodSelect", "Speedbug", "TaxonDetails", "TaxonList"];

    it("never writes a capture under a screen the device had already walked past", async function () {
        const live = { screen: null };
        // The host cannot reach the container for its first polls, so it starts
        // collecting well after the app has begun — the shape of the CI leg that
        // captured five screens under earlier screens' names.
        const launcher = hostLauncher(live, { blindPolls: 3 });

        await Promise.all([runCapture(SCREENS, live), collect(launcher)]);

        const wrong = launcher.grabs.filter((g) => g.named !== g.held);
        expect(wrong, `captures holding the wrong screen: ${JSON.stringify(wrong)}`).to.deep.equal([]);
    });

    it("captures every screen, in order, when the host is watching from the start", async function () {
        const live = { screen: null };
        const launcher = hostLauncher(live);

        const [, result] = await Promise.all([runCapture(SCREENS, live), collect(launcher)]);

        expect(result.count).to.equal(SCREENS.length);
        expect(launcher.grabs.map((g) => g.named)).to.deep.equal(SCREENS);
        expect(launcher.grabs.filter((g) => g.named !== g.held)).to.deep.equal([]);
    });

    // The gate on its own: a marker announced before anyone is listening is the
    // backlog the host later mistakes for the live screen. Waiting on the runner's
    // own poll count rather than a delay — the runner having polled and still
    // written nothing is the state this asserts.
    it("announces no screen before the host is listening", async function () {
        let polls = 0;
        const port = devicePort();
        const counted = { ...port, sleep: (ms) => { polls++; return port.sleep(ms); } };

        const held = runner.holdUntilShot(counted, "Menu", { pollMs: 1 });
        await waitFor(() => polls >= 3);

        expect(fs.readdirSync(dir), "a screen was announced with no host watching").to.deep.equal([]);

        fs.writeFileSync(path.join(dir, runner.COLLECTOR_READY), "");
        await waitFor(() => fs.existsSync(path.join(dir, runner.readyMarker("Menu"))));
        fs.writeFileSync(path.join(dir, runner.shotMarker("Menu")), "");
        await held;
    });

    // Polls for a condition rather than waiting a fixed time, so the spec is as
    // fast as the machine allows and fails with a clear message instead of hanging.
    function waitFor(predicate) {
        return new Promise((resolve, reject) => {
            const giveUp = Date.now() + 5000;
            const tick = () => {
                if (predicate()) { return resolve(); }
                if (Date.now() > giveUp) { return reject(new Error("condition never held")); }
                setTimeout(tick, 5);
            };
            tick();
        });
    }
});
