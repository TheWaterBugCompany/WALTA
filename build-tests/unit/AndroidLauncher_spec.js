import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
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

describe("AndroidLauncher", function() {
  describe("connect()", function() {
    it("runs adb devices and resolves when a device is found", async function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      expect(fakeExecFile.calledOnce).to.be.true;
      expect(fakeExecFile.firstCall.args[1]).to.deep.equal(["devices"]);
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
    it("starts the app using am start with intent when no activity given", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug");
      expect(fakeExecFile.secondCall.args[1]).to.deep.equal([
        "shell", "am", "start",
        "-a", "android.intent.action.MAIN",
        "-c", "android.intent.category.LAUNCHER",
        "-p", "net.thewaterbug.waterbug"
      ]);
    });

    it("starts the app using am start -n when an activity is given", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "shell am start -n net.thewaterbug.waterbug/.WaterbugActivity": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug");
      expect(fakeExecFile.secondCall.args[1]).to.deep.equal([
        "shell", "am", "start", "-n", "net.thewaterbug.waterbug/.WaterbugActivity"
      ]);
    });

    it("uninstalls then installs the APK before starting when an apkPath is given", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "uninstall net.thewaterbug.waterbug": "",
        "install -r ./builds/unit-test/Waterbug.apk": "",
        "shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", "./builds/unit-test/Waterbug.apk");
      expect(fakeExecFile.secondCall.args[1]).to.deep.equal(["uninstall", "net.thewaterbug.waterbug"]);
      expect(fakeExecFile.thirdCall.args[1]).to.deep.equal(["install", "-r", "./builds/unit-test/Waterbug.apk"]);
      expect(fakeExecFile.getCall(3).args[1]).to.deep.equal([
        "shell", "am", "start",
        "-a", "android.intent.action.MAIN",
        "-c", "android.intent.category.LAUNCHER",
        "-p", "net.thewaterbug.waterbug"
      ]);
    });

    it("proceeds with install even if uninstall fails (app not previously installed)", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "uninstall net.thewaterbug.waterbug": new Error("adb: failed to uninstall"),
        "install -r ./builds/unit-test/Waterbug.apk": "",
        "shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
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
        "shell am force-stop net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.terminate("net.thewaterbug.waterbug");
      expect(fakeExecFile.secondCall.args[1]).to.deep.equal([
        "shell", "am", "force-stop", "net.thewaterbug.waterbug"
      ]);
    });
  });
});
