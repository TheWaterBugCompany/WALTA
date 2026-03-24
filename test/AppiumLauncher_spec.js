require("mocha");
const sinon = require("sinon");
const { expect } = require("chai");

const AppiumLauncher = require("../build-utils/AppiumLauncher");

describe("AppiumLauncher", function() {
  let fakeDriver;
  let fakeStartAppium;

  beforeEach(function() {
    fakeDriver = { activateApp: sinon.stub().resolves(), terminateApp: sinon.stub().resolves() };
    fakeStartAppium = sinon.stub().resolves(fakeDriver);
  });

  describe("connect()", function() {
    it("starts an Appium session with Android capabilities", function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      return launcher.connect().then(() => {
        const caps = fakeStartAppium.firstCall.args[0];
        expect(fakeStartAppium.calledOnce).to.be.true;
        expect(caps["platformName"]).to.equal("Android");
        expect(caps["appium:automationName"]).to.equal("uiautomator2");
      });
    });

    it("reuses the existing session on subsequent calls", function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      return launcher.connect()
        .then(() => launcher.connect())
        .then(() => {
          expect(fakeStartAppium.calledOnce).to.be.true;
        });
    });
  });

  describe("launch()", function() {
    it("activates the app with the given appId", function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      return launcher.launch("net.thewaterbug.waterbug").then(() => {
        expect(fakeDriver.activateApp.calledWith("net.thewaterbug.waterbug")).to.be.true;
      });
    });
  });

  describe("terminate()", function() {
    it("terminates the app on Android using the appId", function() {
      const launcher = new AppiumLauncher("android", { startAppium: fakeStartAppium });
      return launcher.terminate("net.thewaterbug.waterbug").then(() => {
        expect(fakeDriver.terminateApp.calledWith("net.thewaterbug.waterbug", undefined)).to.be.true;
      });
    });

    it("terminates the app on iOS using the appId", function() {
      const launcher = new AppiumLauncher("ios", { startAppium: fakeStartAppium });
      return launcher.terminate("net.thewaterbug.waterbug").then(() => {
        expect(fakeDriver.terminateApp.calledWith(undefined, "net.thewaterbug.waterbug")).to.be.true;
      });
    });
  });
});
