import sinon from "sinon";
import { expect } from "chai";
import AppiumLauncher from "../../build-utils/AppiumLauncher.js";

describe("AppiumLauncher", function() {
  let fakeDriver;
  let fakeStartAppium;

  beforeEach(function() {
    fakeDriver = { activateApp: sinon.stub().resolves(), terminateApp: sinon.stub().resolves() };
    fakeStartAppium = sinon.stub().resolves(fakeDriver);
  });

  describe("connect()", function() {
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
});
