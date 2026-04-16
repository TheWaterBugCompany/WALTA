import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import AppiumLauncher from "../../build-utils/AppiumLauncher.js";

describe("AppiumLauncher", function() {
  let fakeDriver;
  let fakeStartAppium;
  const originalMaxListeners = process.getMaxListeners();

  before(function() { process.setMaxListeners(20); });
  after(function() { process.setMaxListeners(originalMaxListeners); });

  beforeEach(function() {
    fakeDriver = {
      activateApp: sinon.stub().resolves(),
      terminateApp: sinon.stub().resolves(),
      getLogs: sinon.stub().resolves([])
    };
    fakeStartAppium = sinon.stub().resolves(fakeDriver);
  });

  describe("connect()", function() {
    it("starts the appium server if it is not already running", async function() {
      const fakeChild = Object.assign(new EventEmitter(), { unref: sinon.stub() });
      const fakeSpawn = sinon.stub().returns(fakeChild);
      const fakeIsRunning = sinon.stub();
      // First call: not running, second call (after spawn): running
      fakeIsRunning.onFirstCall().resolves(false);
      fakeIsRunning.onSecondCall().resolves(true);

      const launcher = new AppiumLauncher("android", {
        startAppium: fakeStartAppium,
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      await launcher.connect();
      expect(fakeSpawn.calledOnce).to.be.true;
      const [cmd, args] = fakeSpawn.firstCall.args;
      expect(cmd).to.equal("npx");
      expect(args).to.include("appium");
    });

    it("does not start the server if it is already running", async function() {
      const fakeSpawn = sinon.stub();
      const fakeIsRunning = sinon.stub().resolves(true);

      const launcher = new AppiumLauncher("android", {
        startAppium: fakeStartAppium,
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      await launcher.connect();
      expect(fakeSpawn.called).to.be.false;
    });

    it("starts an Appium session with Android capabilities", async function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.connect();
      const caps = fakeStartAppium.firstCall.args[0];
      expect(fakeStartAppium.calledOnce).to.be.true;
      expect(caps["platformName"]).to.equal("Android");
      expect(caps["appium:automationName"]).to.equal("uiautomator2");
    });

    it("reuses the existing session on subsequent calls", async function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.connect();
      await launcher.connect();
      expect(fakeStartAppium.calledOnce).to.be.true;
    });

    it("passes a custom host through to startAppium", async function() {
      const launcher = new AppiumLauncher("android", { host: "kobiton", startAppium: fakeStartAppium });
      await launcher.connect();
      expect(fakeStartAppium.firstCall.args[1]).to.equal("kobiton");
    });

    it("defaults to host 'local' when none is provided", async function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.connect();
      expect(fakeStartAppium.firstCall.args[1]).to.equal("local");
    });
  });

  describe("launch()", function() {
    it("activates the app with the given appId", async function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.launch("net.thewaterbug.waterbug");
      expect(fakeDriver.activateApp.calledWith("net.thewaterbug.waterbug")).to.be.true;
    });
  });

  describe("terminate()", function() {
    it("terminates the app on Android using the appId", async function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.terminate("net.thewaterbug.waterbug");
      expect(fakeDriver.terminateApp.calledWith("net.thewaterbug.waterbug", undefined)).to.be.true;
    });

    it("terminates the app on iOS using the appId", async function() {
      const launcher = new AppiumLauncher("ios", { startAppium: fakeStartAppium });
      await launcher.terminate("net.thewaterbug.waterbug");
      expect(fakeDriver.terminateApp.calledWith(undefined, "net.thewaterbug.waterbug")).to.be.true;
    });
  });

  describe("stop()", function() {
    it("calls deleteSession on the driver", async function() {
      fakeDriver.deleteSession = sinon.stub().resolves();
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.connect();
      await launcher.stop();
      expect(fakeDriver.deleteSession.calledOnce).to.be.true;
    });

    it("allows connect() to create a new session after stop()", async function() {
      fakeDriver.deleteSession = sinon.stub().resolves();
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.connect();
      await launcher.stop();
      await launcher.connect();
      expect(fakeStartAppium.calledTwice).to.be.true;
    });

    it("is a no-op when no session exists", async function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.stop(); // should not throw
    });

    it("kills the appium server if we started it", async function() {
      fakeDriver.deleteSession = sinon.stub().resolves();
      const fakeChild = Object.assign(new EventEmitter(), { unref: sinon.stub(), pid: 12345 });
      const fakeSpawn = sinon.stub().returns(fakeChild);
      const fakeIsRunning = sinon.stub();
      fakeIsRunning.onFirstCall().resolves(false);
      fakeIsRunning.onSecondCall().resolves(true);
      const fakeKill = sinon.stub();

      const launcher = new AppiumLauncher("android", {
        startAppium: fakeStartAppium,
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
        killProcess: fakeKill,
      });
      await launcher.connect();
      await launcher.stop();
      expect(fakeKill.calledOnce).to.be.true;
      expect(fakeKill.firstCall.args[0]).to.equal(12345);
    });
  });

  describe("streamLogs()", function() {
    it("polls driver.getLogs and emits each message", async function() {
      fakeDriver.getLogs.resolves([{ message: "log line 1" }, { message: "log line 2" }]);
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium, logPollInterval: 0 });
      await launcher.connect();
      const lines = [];
      const stop = launcher.streamLogs(line => lines.push(line));
      await new Promise(r => setTimeout(r, 10));
      stop();
      expect(lines).to.include("log line 1");
      expect(lines).to.include("log line 2");
    });

    it("returns a stop function that halts polling", async function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium, logPollInterval: 0 });
      await launcher.connect();
      const stop = launcher.streamLogs(() => {});
      stop();
      const callCount = fakeDriver.getLogs.callCount;
      await new Promise(r => setTimeout(r, 20));
      expect(fakeDriver.getLogs.callCount).to.equal(callCount);
    });
  });
});
