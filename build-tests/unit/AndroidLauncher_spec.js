import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import fs from "fs";
import os from "os";
import path from "path";
import * as tar from "tar";
import AndroidLauncher from "../../build-utils/AndroidLauncher.js";

function makeSpawn() {
  const stdout = new EventEmitter();
  const proc = { stdout, kill: sinon.stub() };
  return { stub: sinon.stub().returns(proc), proc };
}

function makeExecFile(responses) {
  return sinon.stub().callsFake((cmd, args, callback) => {
    const key = args.join(" ");
    const response = responses[key];
    if (response instanceof Error) {
      callback(response, "", response.message);
    } else {
      callback(null, response || "", "");
    }
  });
}

const DEVICES_OUTPUT = "List of devices attached\nemulator-5554\tdevice\n";
const NO_DEVICES_OUTPUT = "List of devices attached\n";
// Common responses for the stay-awake commands added in launch()
const STAY_AWAKE_RESPONSES = {
  "-s emulator-5554 shell svc power stayon usb": "",
  "-s emulator-5554 shell input keyevent KEYCODE_WAKEUP": "",
};

describe("AndroidLauncher", function() {
  describe("connect()", function() {
    it("runs adb devices and resolves when a device is found", async function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      expect(fakeExecFile.calledOnce).to.be.true;
      expect(fakeExecFile.firstCall.args[1]).to.deep.equal(["devices"]);
    });

    it("stores the device serial for use in subsequent commands", async function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      expect(launcher._serial).to.equal("emulator-5554");
    });

    it("rejects when no device is connected", async function() {
      const fakeExecFile = makeExecFile({ "devices": NO_DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      try {
        await launcher.connect();
        throw new Error("should have rejected");
      } catch(err) {
        expect(err.message).to.match(/No Android device/);
      }
    });

    it("reuses the connection on subsequent calls", async function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      await launcher.connect();
      expect(fakeExecFile.calledOnce).to.be.true;
    });
  });

  describe("launch()", function() {
    it("clears logcat before starting the app", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug");
      const allArgs = fakeExecFile.getCalls().map(c => c.args[1]);
      expect(allArgs).to.deep.include(["-s", "emulator-5554", "logcat", "-c"]);
    });

    it("starts the app using am start with intent when no activity given", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug");
      expect(fakeExecFile.getCall(4).args[1]).to.deep.equal([
        "-s", "emulator-5554",
        "shell", "am", "start", "-W",
        "-a", "android.intent.action.MAIN",
        "-c", "android.intent.category.LAUNCHER",
        "-p", "net.thewaterbug.waterbug"
      ]);
    });

    it("starts the app using am start -n when an activity is given", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -W -n net.thewaterbug.waterbug/.WaterbugActivity": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug");
      expect(fakeExecFile.getCall(4).args[1]).to.deep.equal([
        "-s", "emulator-5554",
        "shell", "am", "start", "-W", "-n", "net.thewaterbug.waterbug/.WaterbugActivity"
      ]);
    });

    it("passes -W to am start so it waits for the launch to complete (avoids flaky pidof races)", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -W -n net.thewaterbug.waterbug/.WaterbugActivity": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug");
      const amStartCall = fakeExecFile.getCalls().find(c => c.args[1]?.includes("am") && c.args[1]?.includes("start"));
      expect(amStartCall.args[1]).to.include("-W");
    });

    it("reinstalls the APK in place with all runtime permissions granted (-r -g, no uninstall) before starting", async function() {
      // No uninstall: it would wipe runtime grants so the freshly-installed app
      // prompts for a permission at boot and `am start -W` hangs waiting for an
      // idle the dialog never reaches. -g pre-grants on every reinstall.
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 install -r -g ./builds/unit-test/Waterbug.apk": "",
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", "./builds/unit-test/Waterbug.apk");
      const allArgs = fakeExecFile.getCalls().map(c => c.args[1]);
      expect(allArgs).to.not.deep.include(["-s", "emulator-5554", "uninstall", "net.thewaterbug.waterbug"]);
      expect(fakeExecFile.getCall(3).args[1]).to.deep.equal(["-s", "emulator-5554", "install", "-r", "-g", "./builds/unit-test/Waterbug.apk"]);
      expect(fakeExecFile.getCall(4).args[1]).to.deep.equal(["-s", "emulator-5554", "logcat", "-c"]);
      expect(fakeExecFile.getCall(5).args[1]).to.deep.equal([
        "-s", "emulator-5554",
        "shell", "am", "start", "-W",
        "-a", "android.intent.action.MAIN",
        "-c", "android.intent.category.LAUNCHER",
        "-p", "net.thewaterbug.waterbug"
      ]);
    });

    it("appends string launchArgs as --es intent extras on am start (single-quoted)", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -S -W -n net.thewaterbug.waterbug/.WaterbugActivity --es test_grep 'SyncFeedback'": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", null, { test_grep: "SyncFeedback" });
      expect(fakeExecFile.lastCall.args[1]).to.deep.equal([
        "-s", "emulator-5554",
        "shell", "am", "start", "-S", "-W", "-n", "net.thewaterbug.waterbug/.WaterbugActivity",
        "--es", "test_grep", "'SyncFeedback'"
      ]);
    });

    it("appends boolean launchArgs as --ez intent extras on am start", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -S -W -n net.thewaterbug.waterbug/.WaterbugActivity --ez test_manual true": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", null, { test_manual: true });
      expect(fakeExecFile.lastCall.args[1]).to.deep.equal([
        "-s", "emulator-5554",
        "shell", "am", "start", "-S", "-W", "-n", "net.thewaterbug.waterbug/.WaterbugActivity",
        "--ez", "test_manual", "true"
      ]);
    });

    it("combines string and boolean launchArgs on the same am start call", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -S -W -n net.thewaterbug.waterbug/.WaterbugActivity --es test_grep 'SyncFeedback' --ez test_manual true": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", null, { test_grep: "SyncFeedback", test_manual: true });
      expect(fakeExecFile.lastCall.args[1]).to.deep.equal([
        "-s", "emulator-5554",
        "shell", "am", "start", "-S", "-W", "-n", "net.thewaterbug.waterbug/.WaterbugActivity",
        "--es", "test_grep", "'SyncFeedback'",
        "--ez", "test_manual", "true"
      ]);
    });

    it("single-quotes string launchArg values so adb shell does not tokenise on spaces", async function() {
      // Without quoting, `--es test_grep renders Logger lines --ez unit_test true`
      // becomes `am start --es test_grep renders Logger lines --ez unit_test true`
      // on the device — `am start` parses `Logger` as the next positional and
      // everything after is dropped, including `--ez unit_test true`. The
      // dispatcher then doesn't see `unit_test=true` and routes to the prod
      // app instead of the on-device test runner. Reproduced 2026-04-30.
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -S -W -n net.thewaterbug.waterbug/.WaterbugActivity --es test_grep 'renders Logger lines' --ez unit_test true": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", null, {
        test_grep: "renders Logger lines",
        unit_test: true,
      });
      expect(fakeExecFile.lastCall.args[1]).to.deep.equal([
        "-s", "emulator-5554",
        "shell", "am", "start", "-S", "-W", "-n", "net.thewaterbug.waterbug/.WaterbugActivity",
        "--es", "test_grep", "'renders Logger lines'",
        "--ez", "unit_test", "true",
      ]);
    });

    it("escapes embedded single quotes in launchArg string values", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -S -W -n net.thewaterbug.waterbug/.WaterbugActivity --es msg 'don'\\''t panic'": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", null, { msg: "don't panic" });
      expect(fakeExecFile.lastCall.args[1]).to.deep.equal([
        "-s", "emulator-5554",
        "shell", "am", "start", "-S", "-W", "-n", "net.thewaterbug.waterbug/.WaterbugActivity",
        "--es", "msg", "'don'\\''t panic'",
      ]);
    });

    it("omits launchArg flags entirely when no launchArgs are passed", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -W -n net.thewaterbug.waterbug/.WaterbugActivity": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug");
      expect(fakeExecFile.lastCall.args[1]).to.deep.equal([
        "-s", "emulator-5554",
        "shell", "am", "start", "-W", "-n", "net.thewaterbug.waterbug/.WaterbugActivity"
      ]);
    });

    it("proceeds with install even if uninstall fails (app not previously installed)", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        ...STAY_AWAKE_RESPONSES,
        "-s emulator-5554 uninstall net.thewaterbug.waterbug": new Error("adb: failed to uninstall"),
        "-s emulator-5554 install -r ./builds/unit-test/Waterbug.apk": "",
        "-s emulator-5554 logcat -c": "",
        "-s emulator-5554 shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", "./builds/unit-test/Waterbug.apk");
    });
  });

  describe("streamLogs()", function() {
    it("spawns adb logcat and emits extracted TiAPI message content", function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new AndroidLauncher({ execFile: fakeExecFile, spawn: fakeSpawn });
      launcher._connected = true;
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "03-26 21:00:00 I TiAPI   : hello world\n");
      expect(fakeSpawn.firstCall.args[1]).to.deep.equal(["logcat", "-s", "TiAPI:I"]);
      expect(lines).to.deep.equal(["hello world"]);
    });

    it("filters out noisy startup lines", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new AndroidLauncher({ spawn: fakeSpawn });
      launcher._connected = true;
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "03-26 21:00:00 I TiAPI   : Waterbug 1 | startup\n");
      proc.stdout.emit("data", "03-26 21:00:00 I TiAPI   : ti.playservices: something\n");
      proc.stdout.emit("data", "03-26 21:00:00 I TiAPI   : real log message\n");
      expect(lines).to.deep.equal(["real log message"]);
    });

    it("handles data arriving mid-line", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new AndroidLauncher({ spawn: fakeSpawn });
      launcher._connected = true;
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "I TiAPI   : hel");
      proc.stdout.emit("data", "lo\nI TiAPI   : world\n");
      expect(lines).to.deep.equal(["hello", "world"]);
    });

    it("returns a stop function that kills the process", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new AndroidLauncher({ spawn: fakeSpawn });
      launcher._connected = true;
      const stop = launcher.streamLogs(() => {});
      stop();
      expect(proc.kill.calledOnce).to.be.true;
    });

    it("uses custom logTag when provided", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new AndroidLauncher({ spawn: fakeSpawn, logTag: "MyApp" });
      launcher._connected = true;
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "03-26 21:00:00 I MyApp   : custom tag message\n");
      expect(fakeSpawn.firstCall.args[1]).to.deep.equal(["logcat", "-s", "MyApp:I"]);
      expect(lines).to.deep.equal(["custom tag message"]);
    });

    it("uses custom logNoisePattern when provided", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new AndroidLauncher({ spawn: fakeSpawn, logNoisePattern: /^NOISE:/ });
      launcher._connected = true;
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "I TiAPI   : NOISE: skip this\n");
      proc.stdout.emit("data", "I TiAPI   : keep this\n");
      expect(lines).to.deep.equal(["keep this"]);
    });
  });

  describe("terminate()", function() {
    it("force-stops the app using am force-stop with the given appId", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "-s emulator-5554 shell am force-stop net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.terminate("net.thewaterbug.waterbug");
      expect(fakeExecFile.secondCall.args[1]).to.deep.equal([
        "-s", "emulator-5554", "shell", "am", "force-stop", "net.thewaterbug.waterbug"
      ]);
    });
  });

  // The log stream is filtered to the Titanium tag, so when a run hangs with no
  // output there is nothing to diagnose from. These capture the wider state.
  describe("captureDiagnostics()", function() {
    const APP_ID = "net.thewaterbug.waterbug";

    const PIDOF = `-s emulator-5554 shell pidof ${APP_ID}`;
    const CRASH = "-s emulator-5554 logcat -b crash -d -t 50";
    const TAIL = "-s emulator-5554 logcat -d -t 100 TiAPI:V AndroidRuntime:E *:E";

    function diagnosticResponses(overrides = {}) {
      return Object.assign({
        "devices": DEVICES_OUTPUT,
        [PIDOF]: "4321\n",
        [CRASH]: "",
        [TAIL]: "E AndroidRuntime: FATAL EXCEPTION\n",
      }, overrides);
    }

    it("reports the app process id when it is running", async function() {
      const launcher = new AndroidLauncher({ execFile: makeExecFile(diagnosticResponses()) });
      const report = await launcher.captureDiagnostics(APP_ID);
      expect(report).to.match(/4321/);
    });

    // `adb shell pidof` exits non-zero when no process matches, so the most
    // important signal — the app never started — arrives as a command failure.
    it("reports the app as not running when pidof exits non-zero", async function() {
      const launcher = new AndroidLauncher({
        execFile: makeExecFile(diagnosticResponses({ [PIDOF]: new Error("Command failed: pidof") }))
      });
      const report = await launcher.captureDiagnostics(APP_ID);
      expect(report).to.match(/not running/i);
      expect(report).to.not.match(/probe failed/i);
    });

    it("includes errors and Titanium output rather than the whole noisy buffer", async function() {
      const launcher = new AndroidLauncher({ execFile: makeExecFile(diagnosticResponses()) });
      const report = await launcher.captureDiagnostics(APP_ID);
      expect(report).to.match(/FATAL EXCEPTION/);
    });

    it("includes the crash buffer, which survives the app dying", async function() {
      const launcher = new AndroidLauncher({
        execFile: makeExecFile(diagnosticResponses({ [CRASH]: "F DEBUG: signal 11 SIGSEGV\n" }))
      });
      const report = await launcher.captureDiagnostics(APP_ID);
      expect(report).to.match(/SIGSEGV/);
    });

    // Diagnostics run on a path that is already failing — they must never
    // replace the original failure with one of their own.
    it("still reports what it could gather when a probe fails", async function() {
      const launcher = new AndroidLauncher({
        execFile: makeExecFile(diagnosticResponses({ [TAIL]: new Error("device offline") }))
      });
      const report = await launcher.captureDiagnostics(APP_ID);
      expect(report).to.match(/4321/);
      expect(report).to.match(/device offline/);
    });
  });

  // See IosSimulatorLauncher for why this exists: a previous run's capture-done
  // marker outlives the app and makes the host finish before this run has begun.
  describe("clearVisualCaptureFiles()", function() {
    const APP_ID = "net.thewaterbug.waterbug";

    it("removes the handshake dir a previous run left behind", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        [`-s emulator-5554 exec-out run-as ${APP_ID} find . -type d -name visual`]: "./files/visual\n",
        [`-s emulator-5554 exec-out run-as ${APP_ID} rm -rf ./files/visual`]: "",
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.connect();

      await launcher.clearVisualCaptureFiles(APP_ID, { subdir: "visual" });

      expect(fakeExecFile.lastCall.args[1]).to.deep.equal(
        ["-s", "emulator-5554", "exec-out", "run-as", APP_ID, "rm", "-rf", "./files/visual"]);
    });

    // It runs before the app is installed, so there is nothing to find, and
    // nothing to clear is success.
    it("is happy when the app has written no handshake dir yet", async function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.connect();

      await launcher.clearVisualCaptureFiles(APP_ID, { subdir: "visual" });
    });
  });

  describe("pullCapturedScreenshots()", function() {
    const APP_ID = "net.thewaterbug.waterbug";
    const DEVICE_DIR = "/data/data/net.thewaterbug.waterbug/files/visual";

    // A spawn whose child streams a caller-supplied buffer on stdout then closes,
    // standing in for `adb exec-out run-as … tar c` piping a tar archive back.
    function makeBinarySpawn(streamBuffer) {
      const proc = new EventEmitter();
      proc.stdout = new EventEmitter();
      proc.kill = sinon.stub();
      const stub = sinon.stub().callsFake(() => {
        setImmediate(() => {
          proc.stdout.emit("data", streamBuffer);
          proc.emit("close", 0);
        });
        return proc;
      });
      return { stub, proc };
    }

    it("extracts the captured PNGs from the run-as tar stream into destDir", async function() {
      // Build a real tar of a fixture visual dir to feed through the fake spawn.
      const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "android-visual-src-"));
      fs.writeFileSync(path.join(fixture, "Menu.png"), "png-a");
      fs.writeFileSync(path.join(fixture, "Speedbug.png"), "png-b");
      const tarBuf = tar.c({ cwd: fixture, sync: true }, ["."]).read();

      const { stub: fakeSpawn } = makeBinarySpawn(tarBuf);
      const launcher = new AndroidLauncher({
        execFile: makeExecFile({ "devices": DEVICES_OUTPUT }),
        spawn: fakeSpawn,
      });
      await launcher.connect();

      const dest = fs.mkdtempSync(path.join(os.tmpdir(), "android-visual-dest-"));
      const pulled = await launcher.pullCapturedScreenshots(APP_ID, { deviceDir: DEVICE_DIR, destDir: dest });

      expect(fs.readFileSync(path.join(dest, "Menu.png"), "utf8")).to.equal("png-a");
      expect(fs.readFileSync(path.join(dest, "Speedbug.png"), "utf8")).to.equal("png-b");
      expect(pulled).to.have.length(2);

      // it runs `run-as <pkg> tar c -C <dir>` under the connected serial
      const spawnArgs = fakeSpawn.firstCall.args[1];
      expect(spawnArgs).to.include.members(["-s", "emulator-5554", "exec-out", "run-as", APP_ID]);

      fs.rmSync(fixture, { recursive: true, force: true });
      fs.rmSync(dest, { recursive: true, force: true });
    });
  });
});
