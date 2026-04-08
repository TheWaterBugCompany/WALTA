import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import IosSimulatorLauncher from "../../build-utils/IosSimulatorLauncher.js";

function makeSpawn() {
  const stdout = new EventEmitter();
  const proc = { stdout, kill: sinon.stub() };
  return { stub: sinon.stub().returns(proc), proc };
}

const UDID = "8A665EBC-2A48-4965-A1B6-E52A289C9744";

function makeExecFile(responses) {
  return sinon.stub().callsFake((_cmd, args, _opts, callback) => {
    const key = args.join(" ");
    const response = responses[key] ??
      Object.entries(responses).find(([k]) => key.startsWith(k))?.[1];
    if (response instanceof Error) {
      callback(response, "", response.message);
    } else {
      callback(null, response || "", "");
    }
  });
}

describe("IosSimulatorLauncher", function() {
  describe("connect()", function() {
    it("boots the simulator via xcrun simctl boot", async function() {
      const fakeExecFile = makeExecFile({
        [`simctl boot ${UDID}`]: "",
      });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.connect();
      const call = fakeExecFile.firstCall;
      expect(call.args[0]).to.equal("xcrun");
      expect(call.args[1]).to.deep.equal(["simctl", "boot", UDID]);
    });

    it("tolerates 'already booted' error from simctl boot", async function() {
      const err = new Error("Unable to boot device in current state: Booted");
      const fakeExecFile = makeExecFile({
        [`simctl boot ${UDID}`]: err,
      });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.connect(); // should not throw
    });

    it("is idempotent — only boots once on repeated connect() calls", async function() {
      const fakeExecFile = makeExecFile({
        [`simctl boot ${UDID}`]: "",
      });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.connect();
      await launcher.connect();
      expect(fakeExecFile.callCount).to.equal(1); // boot once, then idempotent
    });

    it("throws immediately when udid is not provided", async function() {
      const launcher = new IosSimulatorLauncher({});
      try {
        await launcher.connect();
        throw new Error("should have thrown");
      } catch (err) {
        expect(err.message).to.match(/requires a udid/);
      }
    });
  });

  describe("launch()", function() {
    it("installs and launches the app when appPath is given", async function() {
      const APP_PATH = "./builds/unit-test/Waterbug.app";
      const fakeExecFile = makeExecFile({
        [`simctl boot ${UDID}`]: "",

        [`simctl install ${UDID} ${APP_PATH}`]: "",
        [`simctl launch ${UDID} net.thewaterbug.waterbug`]: "net.thewaterbug.waterbug: 1234\n",
      });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.launch("net.thewaterbug.waterbug", APP_PATH);
      const calls = fakeExecFile.getCalls().map(c => c.args[1]);
      expect(calls).to.deep.include(["simctl", "install", UDID, APP_PATH]);
      expect(calls).to.deep.include(["simctl", "launch", UDID, "net.thewaterbug.waterbug"]);
      expect(launcher._pid).to.equal(1234);
    });

    it("launches without installing when no appPath is given", async function() {
      const fakeExecFile = makeExecFile({
        [`simctl boot ${UDID}`]: "",

        [`simctl launch ${UDID} net.thewaterbug.waterbug`]: "net.thewaterbug.waterbug: 5678\n",
      });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.launch("net.thewaterbug.waterbug");
      const calls = fakeExecFile.getCalls().map(c => c.args[1]);
      expect(calls.some(a => a[1] === "install")).to.be.false;
    });
  });

  describe("terminate()", function() {
    it("terminates the app", async function() {
      const fakeExecFile = makeExecFile({
        [`simctl boot ${UDID}`]: "",

        [`simctl terminate ${UDID} net.thewaterbug.waterbug`]: "",
      });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.connect();
      await launcher.terminate("net.thewaterbug.waterbug");
      const call = fakeExecFile.lastCall;
      expect(call.args[1]).to.deep.equal(["simctl", "terminate", UDID, "net.thewaterbug.waterbug"]);
    });

    it("does not throw when the app is not running", async function() {
      const fakeExecFile = makeExecFile({
        [`simctl boot ${UDID}`]: "",

        [`simctl terminate ${UDID} net.thewaterbug.waterbug`]: new Error("not running"),
      });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.connect();
      await launcher.terminate("net.thewaterbug.waterbug"); // should not throw
    });
  });

  describe("streamLogs()", function() {
    it("spawns xcrun simctl spawn log stream and emits filtered lines", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosSimulatorLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[1234] <Notice>: [INFO] hello world\n`);
      expect(fakeSpawn.firstCall.args[0]).to.equal("xcrun");
      expect(fakeSpawn.firstCall.args[1]).to.deep.equal(["simctl", "spawn", UDID, "log", "stream", "--style", "syslog"]);
      expect(lines).to.deep.equal(["[INFO] hello world"]);
    });

    it("handles new iOS syslog format where library appears after the colon", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosSimulatorLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", `2026-03-28 19:00:00.000+1100  localhost Waterbug[1234]: (TitaniumKit) [com.apple.titanium] [INFO] hello world\n`);
      expect(lines).to.deep.equal(["[INFO] hello world"]);
    });

    it("ignores lines not from Waterbug(TitaniumKit)", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosSimulatorLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "Apr  1 10:00:00 iPhone SpringBoard[456] <Notice>: irrelevant\n");
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: keep this\n`);
      expect(lines).to.deep.equal(["keep this"]);
    });

    it("decodes syslog-escaped ANSI sequences (^[ -> ESC)", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosSimulatorLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: \\^[[32m pass \\^[[0m\n`);
      expect(lines).to.deep.equal(["\x1b[32m pass \x1b[0m"]);
    });

    it("handles data arriving mid-line", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosSimulatorLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: hel");
      proc.stdout.emit("data", `lo\nApr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: world\n`);
      expect(lines).to.deep.equal(["hello", "world"]);
    });

    it("filters out [DEBUG] and [TRACE] lines at default info level", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosSimulatorLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [INFO] test passed\n`);
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [DEBUG] debug msg\n`);
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [TRACE] trace msg\n`);
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [WARN] a warning\n`);
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [ERROR] an error\n`);
      expect(lines).to.deep.equal([
        '[INFO] test passed',
        '[WARN] a warning',
        '[ERROR] an error',
      ]);
    });

    it("shows [DEBUG] lines when logLevel is debug", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosSimulatorLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line), { logLevel: 'debug' });
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [INFO] info\n`);
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [DEBUG] debug\n`);
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [TRACE] trace\n`);
      expect(lines).to.deep.equal(['[INFO] info', '[DEBUG] debug']);
    });

    it("shows all lines when logLevel is trace", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosSimulatorLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line), { logLevel: 'trace' });
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [INFO] info\n`);
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [DEBUG] debug\n`);
      proc.stdout.emit("data", `Apr  1 10:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: [TRACE] trace\n`);
      expect(lines).to.deep.equal(['[INFO] info', '[DEBUG] debug', '[TRACE] trace']);
    });

    it("returns a stop function that kills the process", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosSimulatorLauncher({ spawn: fakeSpawn, udid: UDID });
      const stop = launcher.streamLogs(() => {});
      stop();
      expect(proc.kill.calledOnce).to.be.true;
    });

    it("getDriver() returns null", function() {
      const launcher = new IosSimulatorLauncher({ udid: UDID });
      expect(launcher.getDriver()).to.be.null;
    });
  });
});
