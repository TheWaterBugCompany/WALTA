import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import IosLauncher from "../../build-utils/IosLauncher.js";

function makeSpawn() {
  const stdout = new EventEmitter();
  const proc = { stdout, kill: sinon.stub() };
  return { stub: sinon.stub().returns(proc), proc };
}

const DEVICE_ID = "AE7AD959-E617-53D3-920C-678B0F75B77A";
const APP_ID = "net.thewaterbug.waterbug";
const APP_PATH = "./builds/unit-test/Waterbug.app";

const DEVICES_OUTPUT = [
  "Name               Hostname                           Identifier                             State                Model",
  "----------------   --------------------------------   ------------------------------------   ------------------   ----------------------",
  `Michael's iPhone   Michaels-iPhone.coredevice.local   ${DEVICE_ID}   available (paired)   iPhone SE`,
].join("\n");

const NO_DEVICES_OUTPUT = [
  "Name               Hostname                           Identifier                             State                Model",
  "----------------   --------------------------------   ------------------------------------   ------------------   ----------------------",
].join("\n");

const LAUNCH_OUTPUT = JSON.stringify({ result: { process: { processIdentifier: 4242 } } });

function makeExecFile(responses) {
  return sinon.stub().callsFake((cmd, args, callback) => {
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
    it("finds a connected iOS device via devicectl list devices", async function() {
      const fakeExecFile = makeExecFile({ "devicectl list devices": DEVICES_OUTPUT });
      const launcher = new IosLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      expect(launcher._deviceId).to.equal(DEVICE_ID);
    });

    it("rejects when no device is connected", async function() {
      const fakeExecFile = makeExecFile({ "devicectl list devices": NO_DEVICES_OUTPUT });
      const launcher = new IosLauncher({ execFile: fakeExecFile });
      try {
        await launcher.connect();
        throw new Error("should have rejected");
      } catch(err) {
        expect(err.message).to.match(/No iOS device/);
      }
    });

    it("reuses the connection on subsequent calls", async function() {
      const fakeExecFile = makeExecFile({ "devicectl list devices": DEVICES_OUTPUT });
      const launcher = new IosLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      await launcher.connect();
      expect(fakeExecFile.calledOnce).to.be.true;
    });
  });

  describe("launch()", function() {
    it("launches the app and stores the PID", async function() {
      const fakeExecFile = makeExecFile({
        "devicectl list devices": DEVICES_OUTPUT,
        "devicectl device process launch": "",
      });
      const fakeReadFile = makeReadFile(LAUNCH_OUTPUT);
      const launcher = new IosLauncher({ execFile: fakeExecFile, readFile: fakeReadFile });
      await launcher.launch(APP_ID);
      expect(launcher._pid).to.equal(4242);
    });

    it("installs the app before launching when an appPath is given", async function() {
      const installKey = `devicectl device install app --device ${DEVICE_ID} ${APP_PATH}`;
      const fakeExecFile = makeExecFile({
        "devicectl list devices": DEVICES_OUTPUT,
        [installKey]: "",
        "devicectl device process launch": "",
      });
      const fakeReadFile = makeReadFile(LAUNCH_OUTPUT);
      const launcher = new IosLauncher({ execFile: fakeExecFile, readFile: fakeReadFile });
      await launcher.launch(APP_ID, APP_PATH);
      const installCall = fakeExecFile.secondCall;
      expect(installCall.args[1]).to.deep.equal([
        "devicectl", "device", "install", "app", "--device", DEVICE_ID, APP_PATH
      ]);
    });
  });

  describe("terminate()", function() {
    it("terminates the app using the stored PID", async function() {
      const terminateKey = `devicectl device process terminate --device ${DEVICE_ID} --pid 4242`;
      const fakeExecFile = makeExecFile({
        "devicectl list devices": DEVICES_OUTPUT,
        "devicectl device process launch": "",
        [terminateKey]: "",
      });
      const fakeReadFile = makeReadFile(LAUNCH_OUTPUT);
      const launcher = new IosLauncher({ execFile: fakeExecFile, readFile: fakeReadFile });
      await launcher.launch(APP_ID);
      await launcher.terminate(APP_ID);
      const terminateCall = fakeExecFile.lastCall;
      expect(terminateCall.args[1]).to.deep.equal([
        "devicectl", "device", "process", "terminate", "--device", DEVICE_ID, "--pid", "4242"
      ]);
    });

    it("does nothing if the app was not launched", async function() {
      const fakeExecFile = makeExecFile({ "devicectl list devices": DEVICES_OUTPUT });
      const launcher = new IosLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      await launcher.terminate(APP_ID); // should not throw
    });
  });

  describe("streamLogs()", function() {
    it("spawns idevicesyslog and emits Waterbug(TitaniumKit) message content", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosLauncher({ spawn: fakeSpawn, deviceId: DEVICE_ID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", `Mar 26 21:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: hello world\n`);
      expect(fakeSpawn.firstCall.args[0]).to.equal("idevicesyslog");
      expect(fakeSpawn.firstCall.args[1]).to.deep.equal(["-u", DEVICE_ID]);
      expect(lines).to.deep.equal(["hello world"]);
    });

    it("ignores lines not from Waterbug(TitaniumKit)", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosLauncher({ spawn: fakeSpawn, deviceId: DEVICE_ID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "Mar 26 21:00:00 iPhone SpringBoard[456] <Notice>: irrelevant\n");
      proc.stdout.emit("data", `Mar 26 21:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: keep this\n`);
      expect(lines).to.deep.equal(["keep this"]);
    });

    it("handles data arriving mid-line", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosLauncher({ spawn: fakeSpawn, deviceId: DEVICE_ID });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      proc.stdout.emit("data", "Mar 26 21:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: hel");
      proc.stdout.emit("data", `lo\nMar 26 21:00:00 iPhone Waterbug(TitaniumKit)[123] <Notice>: world\n`);
      expect(lines).to.deep.equal(["hello", "world"]);
    });

    it("returns a stop function that kills the process", function() {
      const { stub: fakeSpawn, proc } = makeSpawn();
      const launcher = new IosLauncher({ spawn: fakeSpawn, deviceId: DEVICE_ID });
      const stop = launcher.streamLogs(() => {});
      stop();
      expect(proc.kill.calledOnce).to.be.true;
    });
  });
});
