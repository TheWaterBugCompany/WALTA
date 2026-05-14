import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import IosLauncher from "../../build-utils/IosLauncher.js";

const UDID = "00008150-00056CC22186401C";
const APP_ID = "net.thewaterbug.waterbug";
const APP_PATH = "./builds/unit-test/Waterbug.app";

const LAUNCH_OUTPUT = JSON.stringify({ result: { process: { processIdentifier: 4242 } } });

function makeExecFile(responses) {
  return sinon.stub().callsFake((_cmd, args, callback) => {
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

function makeReadFile(content) {
  return sinon.stub().resolves(content);
}

function makeFakeSpawn() {
  const proc = {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: sinon.stub(),
  };
  return { spawn: sinon.stub().returns(proc), proc };
}

// Apple unified-log line format that `devicectl --console` emits.
function logLine(msg, { pid = 4242, tid = 7546602 } = {}) {
  return `2026-05-14 16:00:55.530 Waterbug[${pid}:${tid}] ${msg}\n`;
}

describe("IosLauncher", function() {
  describe("connect()", function() {
    it("finds a connected iOS device via idevice_id", async function() {
      const fakeExecFile = makeExecFile({ "-l": `${UDID}\n` });
      const launcher = new IosLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      expect(launcher._udid).to.equal(UDID);
    });

    it("rejects when no device is connected", async function() {
      const fakeExecFile = makeExecFile({ "-l": new Error("no device") });
      const launcher = new IosLauncher({ execFile: fakeExecFile });
      try {
        await launcher.connect();
        throw new Error("should have rejected");
      } catch(err) {
        expect(err.message).to.match(/No iOS device/);
      }
    });

    it("rejects when idevice_id returns empty output", async function() {
      const fakeExecFile = makeExecFile({ "-l": "" });
      const launcher = new IosLauncher({ execFile: fakeExecFile });
      try {
        await launcher.connect();
        throw new Error("should have rejected");
      } catch(err) {
        expect(err.message).to.match(/No iOS device/);
      }
    });

    it("reuses the connection on subsequent calls", async function() {
      const fakeExecFile = makeExecFile({ "-l": `${UDID}\n` });
      const launcher = new IosLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      const callCount = fakeExecFile.callCount;
      await launcher.connect();
      expect(fakeExecFile.callCount).to.equal(callCount);
    });
  });

  describe("launch()", function() {
    it("launches the app and stores the PID", async function() {
      const fakeExecFile = makeExecFile({
        "-l": `${UDID}\n`,
        "devicectl device process launch": "",
      });
      const fakeReadFile = makeReadFile(LAUNCH_OUTPUT);
      const launcher = new IosLauncher({ execFile: fakeExecFile, readFile: fakeReadFile });
      await launcher.launch(APP_ID);
      expect(launcher._pid).to.equal(4242);
    });

    it("installs the app before launching when an appPath is given", async function() {
      const installKey = `devicectl device install app --device ${UDID} ${APP_PATH}`;
      const fakeExecFile = makeExecFile({
        "-l": `${UDID}\n`,
        [installKey]: "",
        "devicectl device process launch": "",
      });
      const fakeReadFile = makeReadFile(LAUNCH_OUTPUT);
      const launcher = new IosLauncher({ execFile: fakeExecFile, readFile: fakeReadFile });
      await launcher.launch(APP_ID, APP_PATH);
      const installCall = fakeExecFile.getCalls().find(c => c.args[1]?.[0] === "devicectl" && c.args[1]?.[2] === "install");
      expect(installCall.args[1]).to.deep.equal([
        "devicectl", "device", "install", "app", "--device", UDID, APP_PATH
      ]);
    });

    it("forwards launchArgs as NSUserDefaults-style argv and adds --terminate-existing", async function() {
      const fakeExecFile = makeExecFile({
        "-l": `${UDID}\n`,
        "devicectl device process launch": "",
      });
      const fakeReadFile = makeReadFile(LAUNCH_OUTPUT);
      const launcher = new IosLauncher({ execFile: fakeExecFile, readFile: fakeReadFile });
      await launcher.launch(APP_ID, null, { test_grep: "About", test_manual: true });
      const launchCall = fakeExecFile.getCalls().find(c => c.args[1]?.[2] === "process" && c.args[1]?.[3] === "launch");
      const args = launchCall.args[1];
      expect(args).to.include("--terminate-existing");
      expect(args).to.include("-test_grep");
      expect(args[args.indexOf("-test_grep") + 1]).to.equal("About");
      expect(args).to.include("-test_manual");
      expect(args[args.indexOf("-test_manual") + 1]).to.equal("true");
      expect(args[args.length - 5]).to.equal(APP_ID);
    });
  });

  describe("terminate()", function() {
    it("terminates the app using the stored PID", async function() {
      const terminateKey = `devicectl device process terminate --device ${UDID} --pid 4242`;
      const fakeExecFile = makeExecFile({
        "-l": `${UDID}\n`,
        "devicectl device process launch": "",
        [terminateKey]: "",
      });
      const fakeReadFile = makeReadFile(LAUNCH_OUTPUT);
      const launcher = new IosLauncher({ execFile: fakeExecFile, readFile: fakeReadFile });
      await launcher.launch(APP_ID);
      await launcher.terminate(APP_ID);
      const terminateCall = fakeExecFile.lastCall;
      expect(terminateCall.args[1]).to.deep.equal([
        "devicectl", "device", "process", "terminate", "--device", UDID, "--pid", "4242"
      ]);
    });

    it("does nothing if the app was not launched", async function() {
      const fakeExecFile = makeExecFile({ "-l": `${UDID}\n` });
      const launcher = new IosLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      await launcher.terminate(APP_ID); // should not throw
    });
  });

  describe("streamLogs()", function() {
    function makeLauncher({ launchArgs } = {}) {
      const { spawn, proc } = makeFakeSpawn();
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID, spawn });
      const lines = [];
      const stop = launcher.streamLogs(line => lines.push(line), { launchArgs });
      return { launcher, spawn, proc, lines, stop };
    }

    it("spawns devicectl with --terminate-existing --console for the bundle id", function() {
      const { spawn } = makeLauncher();
      expect(spawn.calledOnce).to.be.true;
      const [cmd, args] = spawn.firstCall.args;
      expect(cmd).to.equal("xcrun");
      expect(args).to.include.members([
        "devicectl", "device", "process", "launch",
        "--terminate-existing", "--console",
        "--device", UDID,
        APP_ID,
      ]);
    });

    it("emits the message portion of Apple-formatted log lines", function() {
      const { proc, lines } = makeLauncher();
      proc.stdout.emit("data", logLine("[INFO] hello world"));
      expect(lines).to.deep.equal(["[INFO] hello world"]);
    });

    it("captures stderr alongside stdout", function() {
      const { proc, lines } = makeLauncher();
      proc.stderr.emit("data", logLine("[ERROR] something broke"));
      expect(lines).to.deep.equal(["[ERROR] something broke"]);
    });

    it("skips devicectl's own chatter that doesn't match the log line format", function() {
      const { proc, lines } = makeLauncher();
      proc.stdout.emit("data", "Acquired tunnel connection to device.\n");
      proc.stdout.emit("data", "Launched application with net.thewaterbug.waterbug bundle identifier.\n");
      proc.stdout.emit("data", logLine("[INFO] real app log"));
      expect(lines).to.deep.equal(["[INFO] real app log"]);
    });

    it("buffers partial chunks until a newline arrives", function() {
      const { proc, lines } = makeLauncher();
      proc.stdout.emit("data", "2026-05-14 16:00:55.530 Waterbug[4242:7546602] [INFO] split ");
      expect(lines).to.deep.equal([]);
      proc.stdout.emit("data", "across chunks\n");
      expect(lines).to.deep.equal(["[INFO] split across chunks"]);
    });

    it("handles multiple lines in a single chunk", function() {
      const { proc, lines } = makeLauncher();
      proc.stdout.emit("data", logLine("[INFO] one") + logLine("[INFO] two") + logLine("[INFO] three"));
      expect(lines).to.deep.equal(["[INFO] one", "[INFO] two", "[INFO] three"]);
    });

    it("filters out [DEBUG] and [TRACE] lines at default info level", function() {
      const { proc, lines } = makeLauncher();
      proc.stdout.emit("data",
        logLine("[INFO] test passed") +
        logLine("[DEBUG] 0: Menu none (no id)") +
        logLine("[TRACE] some trace") +
        logLine("[WARN] a warning") +
        logLine("[ERROR] an error")
      );
      expect(lines).to.deep.equal([
        "[INFO] test passed",
        "[WARN] a warning",
        "[ERROR] an error",
      ]);
    });

    it("shows [DEBUG] lines when logLevel is debug", function() {
      const { spawn, proc } = makeFakeSpawn();
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID, spawn });
      const lines = [];
      launcher.streamLogs(line => lines.push(line), { logLevel: "debug" });
      proc.stdout.emit("data",
        logLine("[INFO] info msg") +
        logLine("[DEBUG] debug msg") +
        logLine("[TRACE] trace msg")
      );
      expect(lines).to.deep.equal(["[INFO] info msg", "[DEBUG] debug msg"]);
    });

    it("shows all lines when logLevel is trace", function() {
      const { spawn, proc } = makeFakeSpawn();
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID, spawn });
      const lines = [];
      launcher.streamLogs(line => lines.push(line), { logLevel: "trace" });
      proc.stdout.emit("data",
        logLine("[INFO] info") +
        logLine("[DEBUG] debug") +
        logLine("[TRACE] trace")
      );
      expect(lines).to.deep.equal(["[INFO] info", "[DEBUG] debug", "[TRACE] trace"]);
    });

    it("forwards launchArgs as NSUserDefaults-style argv after the bundle id", function() {
      const { spawn } = makeLauncher({ launchArgs: { test_grep: "About", test_manual: true } });
      const args = spawn.firstCall.args[1];
      const bundleIdx = args.indexOf(APP_ID);
      const tail = args.slice(bundleIdx + 1);
      expect(tail).to.include("-test_grep");
      expect(tail[tail.indexOf("-test_grep") + 1]).to.equal("About");
      expect(tail).to.include("-test_manual");
      expect(tail[tail.indexOf("-test_manual") + 1]).to.equal("true");
    });

    it("returns a stop function that kills the spawned process", function() {
      const { proc, stop } = makeLauncher();
      stop();
      expect(proc.kill.calledOnce).to.be.true;
    });

    it("throws if the launcher was constructed without an appId", function() {
      const { spawn } = makeFakeSpawn();
      const launcher = new IosLauncher({ udid: UDID, spawn });
      expect(() => launcher.streamLogs(() => {})).to.throw(/appId/);
    });
  });
});
