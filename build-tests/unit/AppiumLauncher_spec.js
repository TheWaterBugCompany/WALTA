import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import AppiumLauncher from "../../build-utils/AppiumLauncher.js";

describe("AppiumLauncher", function() {
  let fakeDriver;
  let fakeStartAppium;
  let originalSimUdid;
  let originalIosDeviceUdid;
  const originalMaxListeners = process.getMaxListeners();

  before(function() { process.setMaxListeners(20); });
  after(function() { process.setMaxListeners(originalMaxListeners); });

  beforeEach(function() {
    fakeDriver = {
      activateApp: sinon.stub().resolves(),
      terminateApp: sinon.stub().resolves(),
      execute: sinon.stub().resolves(),
      getLogs: sinon.stub().resolves([])
    };
    fakeStartAppium = sinon.stub().resolves(fakeDriver);
    // Stub iOS UDID env vars so tests that construct an iOS launcher
    // for command-dispatch assertions (launch/terminate) don't hit the
    // device-path or sim-path UDID throws. Tests that exercise the
    // "env unset" contract delete these in-body.
    originalSimUdid = process.env.SIM_UDID;
    originalIosDeviceUdid = process.env.IOS_DEVICE_UDID;
    process.env.SIM_UDID = "test-sim-udid";
    process.env.IOS_DEVICE_UDID = "test-device-udid";
  });

  afterEach(function() {
    if (originalSimUdid === undefined) delete process.env.SIM_UDID;
    else process.env.SIM_UDID = originalSimUdid;
    if (originalIosDeviceUdid === undefined) delete process.env.IOS_DEVICE_UDID;
    else process.env.IOS_DEVICE_UDID = originalIosDeviceUdid;
  });

  describe("connect()", function() {
    it("starts the appium server using the locally-installed binary (not npx)", async function() {
      // npx adds significant cold-start overhead on macOS CI runners
      // (observed ~8 min from spawn to first stdout). Skip it by going
      // straight to node_modules/.bin/appium. See WB-49.
      const fakeChild = Object.assign(new EventEmitter(), { unref: sinon.stub() });
      const fakeSpawn = sinon.stub().returns(fakeChild);
      const fakeIsRunning = sinon.stub();
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
      expect(cmd).to.match(/[\/\\]node_modules[\/\\]\.bin[\/\\]appium$/);
      expect(args).to.deep.equal([]);
    });

    it("throws after the configured timeout if the appium server never responds", async function() {
      const fakeChild = Object.assign(new EventEmitter(), { unref: sinon.stub() });
      const fakeSpawn = sinon.stub().returns(fakeChild);
      const fakeIsRunning = sinon.stub().resolves(false); // never comes up

      const launcher = new AppiumLauncher("android", {
        startAppium: fakeStartAppium,
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
        serverStartTimeoutMs: 100,
      });

      let caught;
      try { await launcher.connect(); } catch (e) { caught = e; }
      expect(caught, "expected connect() to reject").to.exist;
      expect(caught.message).to.match(/Appium server failed to start within 0\.1s/);
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

  describe("iOS simulator capabilities", function() {
    let originalSimUdid;
    let originalWdaDerived;

    beforeEach(function() {
      originalSimUdid = process.env.SIM_UDID;
      originalWdaDerived = process.env.WDA_DERIVED_DATA_PATH;
      process.env.SIM_UDID = "ABC123-fake-udid";
    });

    afterEach(function() {
      if (originalSimUdid === undefined) delete process.env.SIM_UDID;
      else process.env.SIM_UDID = originalSimUdid;
      if (originalWdaDerived === undefined) delete process.env.WDA_DERIVED_DATA_PATH;
      else process.env.WDA_DERIVED_DATA_PATH = originalWdaDerived;
    });

    it("defaults usePrebuiltWDA to false and omits derivedDataPath", async function() {
      delete process.env.WDA_DERIVED_DATA_PATH;
      const launcher = new AppiumLauncher("ios", { isSimulator: true, startAppium: fakeStartAppium });
      await launcher.connect();
      const caps = fakeStartAppium.firstCall.args[0];
      expect(caps["appium:usePrebuiltWDA"]).to.equal(false);
      expect(caps).to.not.have.property("appium:derivedDataPath");
    });

    it("enables prebuilt WDA when WDA_DERIVED_DATA_PATH is set", async function() {
      process.env.WDA_DERIVED_DATA_PATH = "/tmp/wda-derived";
      const launcher = new AppiumLauncher("ios", { isSimulator: true, startAppium: fakeStartAppium });
      await launcher.connect();
      const caps = fakeStartAppium.firstCall.args[0];
      expect(caps["appium:usePrebuiltWDA"]).to.equal(true);
      expect(caps["appium:derivedDataPath"]).to.equal("/tmp/wda-derived");
    });
  });

  describe("iOS device capabilities", function() {
    let originalUdid;

    beforeEach(function() {
      originalUdid = process.env.IOS_DEVICE_UDID;
    });

    afterEach(function() {
      if (originalUdid === undefined) delete process.env.IOS_DEVICE_UDID;
      else process.env.IOS_DEVICE_UDID = originalUdid;
    });

    it("throws when IOS_DEVICE_UDID is not set", async function() {
      delete process.env.IOS_DEVICE_UDID;
      const launcher = new AppiumLauncher("ios", { isSimulator: false, startAppium: fakeStartAppium });
      let caught;
      try { await launcher.connect(); } catch (e) { caught = e; }
      expect(caught).to.exist;
      expect(caught.message).to.match(/IOS_DEVICE_UDID/);
    });

    it("passes IOS_DEVICE_UDID through as appium:udid", async function() {
      process.env.IOS_DEVICE_UDID = "0123-fake-iphone-udid";
      const launcher = new AppiumLauncher("ios", { isSimulator: false, startAppium: fakeStartAppium });
      await launcher.connect();
      const caps = fakeStartAppium.firstCall.args[0];
      expect(caps["appium:udid"]).to.equal("0123-fake-iphone-udid");
      // Hardcoded device-specific values dropped — Appium discovers them
      // from the connected device.
      expect(caps).to.not.have.property("appium:platformVersion");
      expect(caps).to.not.have.property("appium:deviceName");
    });
  });

  describe("launch()", function() {
    function makeFakeChildExitingZero() {
      const child = new EventEmitter();
      // Schedule a successful close after the current tick so the
      // launch() promise resolves before the test inspects spawn args.
      setImmediate(() => child.emit("close", 0));
      return child;
    }

    it("force-stops and starts the activity on Android via adb am start", async function() {
      const fakeSpawn = sinon.stub().callsFake(() => makeFakeChildExitingZero());
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium, spawn: fakeSpawn });
      await launcher.launch("net.thewaterbug.waterbug");
      const [bin, args] = fakeSpawn.firstCall.args;
      expect(bin === "adb" || bin.endsWith("/adb")).to.be.true;
      expect(args).to.include("am");
      expect(args).to.include("start");
      expect(args).to.include("-S");
      expect(args).to.include("-n");
      expect(args).to.include("net.thewaterbug.waterbug/.WaterbugActivity");
    });

    it("passes launchArgs as --es / --ez flags to am start", async function() {
      const fakeSpawn = sinon.stub().callsFake(() => makeFakeChildExitingZero());
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium, spawn: fakeSpawn });
      await launcher.launch("net.thewaterbug.waterbug", {
        cerdiServerUrl: "http://localhost:3000",
        debug: true,
      });
      const args = fakeSpawn.firstCall.args[1];
      const joined = args.join(" ");
      expect(joined).to.include("--es cerdiServerUrl http://localhost:3000");
      expect(joined).to.include("--ez debug true");
    });

    it("launches the iOS app via mobile: launchApp with bundleId and arguments", async function() {
      const launcher = new AppiumLauncher("ios", { startAppium: fakeStartAppium });
      await launcher.launch("net.thewaterbug.waterbug", { userEmail: "test@example.com" });
      const [command, params] = fakeDriver.execute.firstCall.args;
      expect(command).to.equal("mobile: launchApp");
      expect(params.bundleId).to.equal("net.thewaterbug.waterbug");
      expect(params.arguments).to.deep.equal(["-userEmail", "test@example.com"]);
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

  describe("waitForForeground()", function() {
    // Android's `mobile: queryAppState` takes `appId`, iOS takes `bundleId`.
    // The whole point of the method is to keep that quirk out of step defs.
    it("polls queryAppState with appId on Android", async function() {
      fakeDriver.execute.resolves(4);
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.waitForForeground();
      expect(fakeDriver.execute.calledWith("mobile: queryAppState",
        { appId: "net.thewaterbug.waterbug" })).to.be.true;
    });

    it("polls queryAppState with bundleId on iOS", async function() {
      fakeDriver.execute.resolves(4);
      const launcher = new AppiumLauncher("ios", { startAppium: fakeStartAppium });
      await launcher.waitForForeground();
      expect(fakeDriver.execute.calledWith("mobile: queryAppState",
        { bundleId: "net.thewaterbug.waterbug" })).to.be.true;
    });

    it("returns once queryAppState reports foreground (state === 4)", async function() {
      fakeDriver.execute.onCall(0).resolves(2);
      fakeDriver.execute.onCall(1).resolves(3);
      fakeDriver.execute.onCall(2).resolves(4);
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.waitForForeground({ pollIntervalMs: 1 });
      expect(fakeDriver.execute.callCount).to.equal(3);
    });

    it("gives up after the timeout if state never reaches 4", async function() {
      fakeDriver.execute.resolves(2);
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      await launcher.waitForForeground({ timeoutMs: 20, pollIntervalMs: 5 });
      expect(fakeDriver.execute.callCount).to.be.greaterThan(0);
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

  describe("setLocation()", function() {
    function makeFakeChildExitingZero() {
      const child = new EventEmitter();
      setImmediate(() => child.emit("close", 0));
      return child;
    }

    it("calls `adb emu geo fix <lng> <lat>` on Android", async function() {
      const fakeSpawn = sinon.stub().callsFake(() => makeFakeChildExitingZero());
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium, spawn: fakeSpawn });
      await launcher.setLocation(-37.8136, 144.9631);
      const [bin, args] = fakeSpawn.firstCall.args;
      expect(bin === "adb" || bin.endsWith("/adb")).to.be.true;
      // adb emu geo fix takes longitude first, then latitude.
      expect(args).to.deep.equal(["emu", "geo", "fix", "144.9631", "-37.8136"]);
    });

    it("calls `xcrun simctl location <udid> set <lat>,<lng>` on iOS", async function() {
      const originalUdid = process.env.SIM_UDID;
      process.env.SIM_UDID = "FAKE-UDID";
      const fakeSpawn = sinon.stub().callsFake(() => makeFakeChildExitingZero());
      const launcher = new AppiumLauncher("ios", { isSimulator: true, startAppium: fakeStartAppium, spawn: fakeSpawn });
      try {
        await launcher.setLocation(-37.8136, 144.9631);
      } finally {
        if (originalUdid === undefined) delete process.env.SIM_UDID;
        else process.env.SIM_UDID = originalUdid;
      }
      const [bin, args] = fakeSpawn.firstCall.args;
      expect(bin).to.equal("xcrun");
      // simctl location takes lat,lng (opposite of adb's lng,lat).
      expect(args).to.deep.equal(["simctl", "location", "FAKE-UDID", "set", "-37.8136,144.9631"]);
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
