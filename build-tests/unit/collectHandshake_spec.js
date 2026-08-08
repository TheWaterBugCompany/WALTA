import { expect } from "chai";
import { collectHandshake } from "../../build-utils/visual/collectHandshake.js";

// A launcher stand-in whose visual dir reveals a scripted sequence of file
// listings on successive polls, and records the screenshots + ack files the
// collector produces.
function fakeLauncher(snapshots) {
    const shots = [];
    const written = [];
    let call = 0;
    return {
        shots,
        written,
        async listVisualCaptureFiles() {
            const snap = snapshots[Math.min(call, snapshots.length - 1)];
            call++;
            return snap.slice();
        },
        async screenshotFramebuffer(p) { shots.push(p); },
        async writeVisualCaptureFile(appId, name) { written.push(name); },
    };
}

// Deterministic clock: sleep advances it, so timeout is exercised without real time.
function fakeClock() {
    let t = 0;
    return { now: () => t, sleep: (ms) => { t += ms; return Promise.resolve(); } };
}

describe("collectHandshake", function () {
    it("screenshots each ready screen, acks it with a .shot, and returns the count when done appears", async function () {
        const launcher = fakeLauncher([
            ["Menu.ready"],
            ["Menu.ready", "Speedbug.ready"],
            ["Menu.ready", "Speedbug.ready", "capture-done"],
        ]);
        const { now, sleep } = fakeClock();
        const result = await collectHandshake({
            launcher, appId: "app", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
        });
        expect(result).to.deep.equal({ count: 2 });
        expect(launcher.shots).to.deep.equal(["/out/Menu.png", "/out/Speedbug.png"]);
        expect(launcher.written).to.deep.equal(["Menu.shot", "Speedbug.shot"]);
    });

    it("captures a screen whose .ready lands in the same poll as the done sentinel", async function () {
        const launcher = fakeLauncher([
            ["Menu.ready", "capture-done"],
        ]);
        const { now, sleep } = fakeClock();
        const result = await collectHandshake({
            launcher, appId: "app", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
        });
        expect(result).to.deep.equal({ count: 1 });
        expect(launcher.shots).to.deep.equal(["/out/Menu.png"]);
    });

    it("never re-screenshots a screen it has already grabbed", async function () {
        const launcher = fakeLauncher([
            ["Menu.ready"],
            ["Menu.ready"],
            ["Menu.ready", "capture-done"],
        ]);
        const { now, sleep } = fakeClock();
        await collectHandshake({
            launcher, appId: "app", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
        });
        expect(launcher.shots).to.deep.equal(["/out/Menu.png"]);
    });

    it("keeps polling when listing throws (device/container not ready yet)", async function () {
        // First two polls throw (e.g. simctl get_app_container hangs on a cold,
        // contended runner), then the dir resolves.
        let call = 0;
        const shots = [];
        const launcher = {
            async listVisualCaptureFiles() {
                call++;
                if (call <= 2) throw new Error("get_app_container failed");
                return call === 3 ? ["Menu.ready"] : ["Menu.ready", "capture-done"];
            },
            async screenshotFramebuffer(p) { shots.push(p); },
            async writeVisualCaptureFile() {},
        };
        const { now, sleep } = fakeClock();
        const result = await collectHandshake({
            launcher, appId: "app", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
        });
        expect(result).to.deep.equal({ count: 1 });
        expect(shots).to.deep.equal(["/out/Menu.png"]);
    });

    it("retries a screen whose screenshot transiently fails, then captures it", async function () {
        // done only lands after the screen has been acked (mirrors the runner,
        // which holds the screen until .shot before writing capture-done).
        let call = 0, attempts = 0;
        const shots = [];
        const launcher = {
            async listVisualCaptureFiles() {
                call++;
                return call <= 2 ? ["Menu.ready"] : ["Menu.ready", "capture-done"];
            },
            async screenshotFramebuffer(p) {
                attempts++;
                if (attempts === 1) throw new Error("simctl io screenshot failed");
                shots.push(p);
            },
            async writeVisualCaptureFile() {},
        };
        const { now, sleep } = fakeClock();
        const result = await collectHandshake({
            launcher, appId: "app", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
        });
        // The failed first attempt didn't ack Menu; the next poll retried and got it.
        expect(shots).to.deep.equal(["/out/Menu.png"]);
        expect(result.count).to.equal(1);
    });

    it("times out with a clear error when the done sentinel never arrives", async function () {
        const launcher = fakeLauncher([["Menu.ready"]]);
        const { now, sleep } = fakeClock();
        let err;
        try {
            await collectHandshake({
                launcher, appId: "app", actualDir: "/out", timeoutMs: 500, pollMs: 100, now, sleep,
            });
        } catch (e) { err = e; }
        expect(err).to.be.an("error");
        expect(err.message).to.match(/timed out after 1s with no capture-done/);
    });
});
