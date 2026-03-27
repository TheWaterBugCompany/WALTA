import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import IosLauncher from "../../build-utils/IosLauncher.js";

function makeSpawn() {
  const stdout = new EventEmitter();
  const proc = { stdout, kill: sinon.stub() };
  return { stub: sinon.stub().returns(proc), proc };
}


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
    it("spawns idevicesyslog with the UDID and emits filtered messages", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", `Mar 26 21:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: hello world\n`);
      expect(fakeSpawn.firstCall.args[0]).to.equal("idevicesyslog");
      expect(fakeSpawn.firstCall.args[1]).to.deep.equal(["-u", UDID]);
      expect(lines).to.deep.equal(["hello world"]);
    });

    it("ignores lines not from Waterbug(TitaniumKit)", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "Mar 26 21:00:00 iPhone SpringBoard[456] <Notice>: irrelevant\n");
      proc.stdout.emit("data", `Mar 26 21:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: keep this\n`);
      expect(lines).to.deep.equal(["keep this"]);
    });

    it("handles data arriving mid-line", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosLauncher({ spawn: fakeSpawn, udid: UDID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "Mar 26 21:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: hel");
      proc.stdout.emit("data", `lo\nMar 26 21:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: world\n`);
      expect(lines).to.deep.equal(["hello", "world"]);
    });

    it("returns a stop function that kills the process", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosLauncher({ spawn: fakeSpawn, udid: UDID });
      const stop = launcher.streamLogs(() => {});
      stop();
      expect(proc.kill.calledOnce).to.be.true;
    });

    it("uses custom logProcessName when provided", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosLauncher({ spawn: fakeSpawn, udid: UDID, logProcessName: "MyApp(MyFramework)" });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "Mar 26 21:00:00 iPhone MyApp(MyFramework)[123] <Notice>: custom message\n");
      proc.stdout.emit("data", "Mar 26 21:00:00 iPhone OtherApp[456] <Notice>: ignored\n");
      expect(lines).to.deep.equal(["custom message"]);
    });
  });
});
