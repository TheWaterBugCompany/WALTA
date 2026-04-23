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

function makeFakeIosDevice() {
  const handle = new EventEmitter();
  handle.stop = sinon.stub();
  return {
    forward: sinon.stub().returns(handle),
    handle,
  };
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
    it("uses node-ios-device port forwarding and emits messages", function() {
      const fakeDevice = makeFakeIosDevice();
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID, iosDevice: fakeDevice });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      expect(fakeDevice.forward.calledOnce).to.be.true;
      expect(fakeDevice.forward.firstCall.args[0]).to.equal(UDID);
      fakeDevice.handle.emit('data', '[INFO] hello world');
      expect(lines).to.deep.equal(['[INFO] hello world']);
    });

    it("skips JSON header messages", function() {
      const fakeDevice = makeFakeIosDevice();
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID, iosDevice: fakeDevice });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      fakeDevice.handle.emit('data', '{"appId":"net.thewaterbug.waterbug"}');
      fakeDevice.handle.emit('data', '[INFO] real message');
      expect(lines).to.deep.equal(['[INFO] real message']);
    });

    it("filters out [DEBUG] and [TRACE] lines at default info level", function() {
      const fakeDevice = makeFakeIosDevice();
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID, iosDevice: fakeDevice });
      const lines = [];
      launcher.streamLogs(line => lines.push(line));
      fakeDevice.handle.emit('data', '[INFO] test passed');
      fakeDevice.handle.emit('data', '[DEBUG] 0: Menu none (no id)');
      fakeDevice.handle.emit('data', '[TRACE] some trace');
      fakeDevice.handle.emit('data', '[WARN] a warning');
      fakeDevice.handle.emit('data', '[ERROR] an error');
      expect(lines).to.deep.equal([
        '[INFO] test passed',
        '[WARN] a warning',
        '[ERROR] an error',
      ]);
    });

    it("shows [DEBUG] lines when logLevel is debug", function() {
      const fakeDevice = makeFakeIosDevice();
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID, iosDevice: fakeDevice });
      const lines = [];
      launcher.streamLogs(line => lines.push(line), { logLevel: 'debug' });
      fakeDevice.handle.emit('data', '[INFO] test passed');
      fakeDevice.handle.emit('data', '[DEBUG] debug msg');
      fakeDevice.handle.emit('data', '[TRACE] trace msg');
      expect(lines).to.deep.equal([
        '[INFO] test passed',
        '[DEBUG] debug msg',
      ]);
    });

    it("shows all lines when logLevel is trace", function() {
      const fakeDevice = makeFakeIosDevice();
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID, iosDevice: fakeDevice });
      const lines = [];
      launcher.streamLogs(line => lines.push(line), { logLevel: 'trace' });
      fakeDevice.handle.emit('data', '[INFO] info');
      fakeDevice.handle.emit('data', '[DEBUG] debug');
      fakeDevice.handle.emit('data', '[TRACE] trace');
      expect(lines).to.deep.equal(['[INFO] info', '[DEBUG] debug', '[TRACE] trace']);
    });

    it("returns a stop function that stops the handle", function() {
      const fakeDevice = makeFakeIosDevice();
      const launcher = new IosLauncher({ udid: UDID, appId: APP_ID, iosDevice: fakeDevice });
      const stop = launcher.streamLogs(() => {});
      stop();
      expect(fakeDevice.handle.stop.calledOnce).to.be.true;
    });
  });
});
