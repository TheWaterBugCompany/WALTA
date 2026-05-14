import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import IosLauncher from "../../build-utils/IosLauncher.js";

const UDID = "00008150-00056CC22186401C";
const APP_ID = "net.thewaterbug.waterbug";
const APP_PATH = "./builds/unit-test/Waterbug.app";

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

// Stand-in for the ChildProcess that devicectl --console keeps alive.
// stdout / stderr are EventEmitters the test can `emit('data', ...)` on.
// `on('exit', fn)` is wired up so launch()'s rejection path is testable.
//
// When `autoLaunch` is true (default), the spawn stub schedules a
// "Launched application with..." emit one tick after it's invoked — so
// `await launcher.launch(...)` resolves naturally. Disable for tests
// that exercise the rejection path.
function makeFakeSpawn({ autoLaunch = true } = {}) {
  const proc = new EventEmitter();
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = sinon.stub();
  const spawn = sinon.stub().callsFake(() => {
    if (autoLaunch) {
      // setImmediate gives launch()'s `proc.stdout.on('data', onBootstrap)`
      // a chance to attach before the confirmation lands.
      setImmediate(() => proc.stdout.emit("data", "Launched application with com.example.bundle bundle identifier.\r\n"));
    }
    return proc;
  });
  return { spawn, proc };
}

// Apple unified-log line format that `devicectl --console` emits.
function logLine(msg, { pid = 4242, tid = 7546602 } = {}) {
  return `2026-05-14 16:00:55.530 Waterbug[${pid}:${tid}] ${msg}\r\n`;
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
    function makeFakeExecFile(extras = {}) {
      return makeExecFile({ "-l": `${UDID}\n`, ...extras });
    }

    it("spawns devicectl with --terminate-existing --console for the bundle id", async function() {
      const { spawn, proc } = makeFakeSpawn();
      const launcher = new IosLauncher({ execFile: makeFakeExecFile(), spawn, udid: UDID });
      await launcher.launch(APP_ID);

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

    it("installs the app before launching when an appPath is given", async function() {
      const installKey = `devicectl device install app --device ${UDID} ${APP_PATH}`;
      const fakeExecFile = makeFakeExecFile({ [installKey]: "" });
      const { spawn } = makeFakeSpawn();
      const launcher = new IosLauncher({ execFile: fakeExecFile, spawn, udid: UDID });
      await launcher.launch(APP_ID, APP_PATH);

      const installCall = fakeExecFile.getCalls().find(c => c.args[1]?.[2] === "install");
      expect(installCall.args[1]).to.deep.equal([
        "devicectl", "device", "install", "app", "--device", UDID, APP_PATH
      ]);
    });

    it("forwards launchArgs as NSUserDefaults-style argv after the bundle id", async function() {
      const { spawn } = makeFakeSpawn();
      const launcher = new IosLauncher({ execFile: makeFakeExecFile(), spawn, udid: UDID });
      await launcher.launch(APP_ID, null, { test_grep: "About", test_manual: true });

      const args = spawn.firstCall.args[1];
      const tail = args.slice(args.indexOf(APP_ID) + 1);
      expect(tail).to.include("-test_grep");
      expect(tail[tail.indexOf("-test_grep") + 1]).to.equal("About");
      expect(tail).to.include("-test_manual");
      expect(tail[tail.indexOf("-test_manual") + 1]).to.equal("true");
    });

    it("rejects if devicectl exits before printing the launch confirmation", async function() {
      const { spawn, proc } = makeFakeSpawn({ autoLaunch: false });
      const launcher = new IosLauncher({ execFile: makeFakeExecFile(), spawn, udid: UDID });
      const launchPromise = launcher.launch(APP_ID);
      // Wait one tick so the launch listener has attached, then emit exit
      // without the confirmation line.
      setImmediate(() => proc.emit("exit", 1));
      try {
        await launchPromise;
        throw new Error("should have rejected");
      } catch(err) {
        expect(err.message).to.match(/before launch confirmation/);
      }
    });
  });

  describe("terminate()", function() {
    it("kills the spawned devicectl process", async function() {
      const { spawn, proc } = makeFakeSpawn();
      const launcher = new IosLauncher({ execFile: makeExecFile({ "-l": `${UDID}\n` }), spawn, udid: UDID });
      await launcher.launch(APP_ID);
      await launcher.terminate(APP_ID);
      expect(proc.kill.calledOnce).to.be.true;
    });

    it("does nothing if the app was not launched", async function() {
      const launcher = new IosLauncher({ execFile: makeExecFile({ "-l": `${UDID}\n` }) });
      await launcher.connect();
      await launcher.terminate(APP_ID); // should not throw
    });
  });

  describe("streamLogs()", function() {
    // Drive a launcher through launch() so streamLogs() has a proc to attach to.
    async function makeLaunched({ logLevel } = {}) {
      const { spawn, proc } = makeFakeSpawn();
      const launcher = new IosLauncher({
        execFile: makeExecFile({ "-l": `${UDID}\n` }),
        spawn,
        udid: UDID,
      });
      await launcher.launch(APP_ID);
      const lines = [];
      const stop = launcher.streamLogs(line => lines.push(line), { logLevel });
      return { launcher, spawn, proc, lines, stop };
    }

    it("emits the message portion of Apple-formatted log lines", async function() {
      const { proc, lines } = await makeLaunched();
      proc.stdout.emit("data", logLine("[INFO] hello world"));
      expect(lines).to.deep.equal(["[INFO] hello world"]);
    });

    it("captures stderr alongside stdout", async function() {
      const { proc, lines } = await makeLaunched();
      proc.stderr.emit("data", logLine("[ERROR] something broke"));
      expect(lines).to.deep.equal(["[ERROR] something broke"]);
    });

    it("skips devicectl's own chatter that doesn't match the log line format", async function() {
      const { proc, lines } = await makeLaunched();
      proc.stdout.emit("data", "Acquired tunnel connection to device.\r\n");
      proc.stdout.emit("data", logLine("[INFO] real app log"));
      expect(lines).to.deep.equal(["[INFO] real app log"]);
    });

    it("buffers partial chunks until a newline arrives", async function() {
      const { proc, lines } = await makeLaunched();
      proc.stdout.emit("data", "2026-05-14 16:00:55.530 Waterbug[4242:7546602] [INFO] split ");
      expect(lines).to.deep.equal([]);
      proc.stdout.emit("data", "across chunks\r\n");
      expect(lines).to.deep.equal(["[INFO] split across chunks"]);
    });

    it("handles multiple lines in a single chunk", async function() {
      const { proc, lines } = await makeLaunched();
      proc.stdout.emit("data", logLine("[INFO] one") + logLine("[INFO] two") + logLine("[INFO] three"));
      expect(lines).to.deep.equal(["[INFO] one", "[INFO] two", "[INFO] three"]);
    });

    it("handles CRLF line endings (devicectl actually emits \\r\\n)", async function() {
      const { proc, lines } = await makeLaunched();
      // Exact byte sequence captured from `xcrun devicectl device process
      // launch --console` against the HelloWorld fixture.
      proc.stderr.emit("data", "2026-05-14 17:27:37.217 HelloWorld[77481:7597330] App started\r\n");
      expect(lines).to.deep.equal(["App started"]);
    });

    it("filters out [DEBUG] and [TRACE] lines at default info level", async function() {
      const { proc, lines } = await makeLaunched();
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

    it("shows [DEBUG] lines when logLevel is debug", async function() {
      const { proc, lines } = await makeLaunched({ logLevel: "debug" });
      proc.stdout.emit("data",
        logLine("[INFO] info msg") +
        logLine("[DEBUG] debug msg") +
        logLine("[TRACE] trace msg")
      );
      expect(lines).to.deep.equal(["[INFO] info msg", "[DEBUG] debug msg"]);
    });

    it("shows all lines when logLevel is trace", async function() {
      const { proc, lines } = await makeLaunched({ logLevel: "trace" });
      proc.stdout.emit("data",
        logLine("[INFO] info") +
        logLine("[DEBUG] debug") +
        logLine("[TRACE] trace")
      );
      expect(lines).to.deep.equal(["[INFO] info", "[DEBUG] debug", "[TRACE] trace"]);
    });

    it("returns a stop function that detaches the listener without killing the proc", async function() {
      const { proc, stop, lines } = await makeLaunched();
      stop();
      proc.stdout.emit("data", logLine("[INFO] after stop"));
      expect(lines).to.deep.equal([]);
      expect(proc.kill.called, "stop() must not kill the proc — terminate() owns lifecycle").to.be.false;
    });

    it("throws if streamLogs is called before launch", function() {
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID });
      expect(() => launcher.streamLogs(() => {})).to.throw(/launch\(\) must be called/);
    });
  });
});
