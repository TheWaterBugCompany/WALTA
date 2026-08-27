import { expect } from "chai";
import { collectHandshake } from "../../build-utils/visual/collectHandshake.js";

// A launcher stand-in whose visual dir reveals a scripted sequence of file
// listings on successive polls, and records the screenshots + ack files the
// collector produces.
function fakeLauncher(snapshots) {
    const shots = [];
    const written = [];
    const acks = [];
    let call = 0;
    return {
        shots,
        written,
        acks,
        async listVisualCaptureFiles() {
            const snap = snapshots[Math.min(call, snapshots.length - 1)];
            call++;
            return snap.slice();
        },
        async screenshotFramebuffer(p) { shots.push(p); },
        async writeVisualCaptureFile(appId, name) {
            written.push(name);
            if (name.endsWith(".shot")) { acks.push(name); }
        },
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
            looksBlank: async () => false,
        });
        expect(result).to.deep.equal({ count: 2, blank: [] });
        expect(launcher.shots).to.deep.equal(["/out/Menu.png", "/out/Speedbug.png"]);
        expect(launcher.acks).to.deep.equal(["Menu.shot", "Speedbug.shot"]);
    });

    it("captures a screen whose .ready lands in the same poll as the done sentinel", async function () {
        const launcher = fakeLauncher([
            ["Menu.ready", "capture-done"],
        ]);
        const { now, sleep } = fakeClock();
        const result = await collectHandshake({
            launcher, appId: "app", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
            looksBlank: async () => false,
        });
        expect(result).to.deep.equal({ count: 1, blank: [] });
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
            looksBlank: async () => false,
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
            looksBlank: async () => false,
        });
        expect(result).to.deep.equal({ count: 1, blank: [] });
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
            looksBlank: async () => false,
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
                launcher, appId: "app", actualDir: "/out", timeoutMs: 500, pollMs: 100, now, sleep, looksBlank: async () => false,
            });
        } catch (e) { err = e; }
        expect(err).to.be.an("error");
        expect(err.message).to.match(/timed out after 1s with no capture-done/);
    });

    // The runner opens no screen until it sees this marker, and it wipes the dir
    // at the start of a run — so announcing once would let a wipe strand it.
    it("announces itself on every poll, so the runner's wipe can't strand it", async function () {
        const launcher = fakeLauncher([[], [], ["capture-done"]]);
        const { now, sleep } = fakeClock();
        await collectHandshake({
            launcher, appId: "app", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
            looksBlank: async () => false,
        });
        expect(launcher.written.filter((n) => n === "collector-ready")).to.have.length(3);
    });
});

// A frame checker driven by a script of verdicts per screen name: each entry is
// consumed in turn, so ["blank", "drawn"] means the first grab came back blank
// and the re-grab had content.
function fakeFrames(script) {
    const seen = {};
    return async (file) => {
        const name = file.split("/").pop().replace(/\.png$/, "");
        const verdicts = script[name] || ["drawn"];
        const i = Math.min(seen[name] || 0, verdicts.length - 1);
        seen[name] = (seen[name] || 0) + 1;
        return verdicts[i] === "blank";
    };
}

describe("collectHandshake blank frames", function () {
    it("grabs a blank frame again rather than acking it, and acks once it has content", async function () {
        const launcher = fakeLauncher([
            ["Menu.ready"],
            ["Menu.ready"],
            ["Menu.ready", "capture-done"],
        ]);
        const { now, sleep } = fakeClock();
        const result = await collectHandshake({
            launcher, appId: "app", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
            looksBlank: fakeFrames({ Menu: ["blank", "drawn"] }),
        });
        expect(launcher.shots).to.deep.equal(["/out/Menu.png", "/out/Menu.png"]);
        expect(launcher.acks).to.deep.equal(["Menu.shot"]);
        expect(result.count).to.equal(1);
        expect(result.blank).to.deep.equal([]);
    });

    it("gives up on a screen that stays blank, acking it so the runner isn't stranded, and reports it", async function () {
        const launcher = fakeLauncher([
            ["Menu.ready"], ["Menu.ready"], ["Menu.ready"], ["Menu.ready"],
            ["Menu.ready", "capture-done"],
        ]);
        const { now, sleep } = fakeClock();
        const result = await collectHandshake({
            launcher, appId: "app", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
            blankAttempts: 3,
            looksBlank: fakeFrames({ Menu: ["blank"] }),
        });
        expect(launcher.shots).to.have.length(3);
        expect(launcher.acks).to.deep.equal(["Menu.shot"]);
        expect(result.blank).to.deep.equal(["Menu"]);
    });
});

// A launcher that also answers which window the OS currently has focused,
// reading a scripted sequence — one entry per query.
function fakeLauncherWithWindows(snapshots, windows) {
    const launcher = fakeLauncher(snapshots);
    let call = 0;
    launcher.foregroundWindow = async () => windows[Math.min(call++, windows.length - 1)];
    return launcher;
}

const APP_WINDOW = "Window{a1 u0 com.thewaterbugcompany.walta/org.appcelerator.titanium.TiActivity}";
const ANR_DIALOG = "Window{b2 u0 Application Not Responding: com.google.android.apps.nexuslauncher}";

describe("collectHandshake foreign windows", function () {
    it("grabs a screen again rather than acking one shot behind a system dialog", async function () {
        const launcher = fakeLauncherWithWindows([
            ["Menu.ready"],
            ["Menu.ready"],
            ["Menu.ready", "capture-done"],
        ], [ANR_DIALOG, APP_WINDOW]);
        const { now, sleep } = fakeClock();
        const result = await collectHandshake({
            launcher, appId: "com.thewaterbugcompany.walta", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
            looksBlank: async () => false,
        });
        expect(launcher.shots).to.deep.equal(["/out/Menu.png", "/out/Menu.png"]);
        expect(launcher.acks).to.deep.equal(["Menu.shot"]);
        expect(result.count).to.equal(1);
    });

    it("fails the run and names the window when the dialog never clears", async function () {
        const launcher = fakeLauncherWithWindows([["Menu.ready"]], [ANR_DIALOG]);
        const { now, sleep } = fakeClock();
        let err;
        try {
            await collectHandshake({
                launcher, appId: "com.thewaterbugcompany.walta", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
                obscuredAttempts: 3,
                looksBlank: async () => false,
            });
        } catch (e) { err = e; }
        expect(err).to.be.an("error");
        expect(err.message).to.match(/Menu was shot behind another window 3 times/);
        expect(err.message).to.contain("Application Not Responding: com.google.android.apps.nexuslauncher");
        expect(launcher.acks).to.be.empty;
    });

    // iOS has no equivalent of dumpsys, so its launcher answers nothing and the
    // check stays off rather than guessing from pixels.
    it("captures normally when the launcher cannot say what is on top", async function () {
        const launcher = fakeLauncher([["Menu.ready", "capture-done"]]);
        const { now, sleep } = fakeClock();
        const result = await collectHandshake({
            launcher, appId: "com.thewaterbugcompany.walta", actualDir: "/out", timeoutMs: 10000, pollMs: 100, now, sleep,
            looksBlank: async () => false,
        });
        expect(result.count).to.equal(1);
        expect(launcher.acks).to.deep.equal(["Menu.shot"]);
    });
});
