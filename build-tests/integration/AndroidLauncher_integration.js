require("mocha");
const path = require("path");
const { execFile } = require("child_process");
const { expect } = require("chai");

const AndroidLauncher = require("../../build-utils/AndroidLauncher");

const HELLO_APK = path.join(__dirname, "hello.apk");
const HELLO_APP_ID = "com.example.helloworld";
const HELLO_ACTIVITY = ".MainActivity";

// Integration tests — these run real adb commands and require a connected device.
// Run with: npx grunt build-integration-test

function adb(...args) {
  return new Promise((resolve, reject) => {
    execFile("adb", args, (err, stdout) => err ? reject(err) : resolve(stdout));
  });
}

function isInstalled(appId) {
  return adb("shell", "pm", "list", "packages", appId)
    .then(out => out.trim().includes(`package:${appId}`));
}

function isRunning(appId) {
  return adb("shell", "pidof", appId)
    .then(out => out.trim().length > 0)
    .catch(() => false);
}

describe("AndroidLauncher (integration)", function() {
  this.timeout(30000);

  let launcher;

  before(function() {
    launcher = new AndroidLauncher({ activity: HELLO_ACTIVITY });
    return launcher.connect().catch(() => {
      this.skip();
    });
  });

  after(function() {
    return adb("uninstall", HELLO_APP_ID).catch(() => {});
  });

  describe("connect()", function() {
    it("finds a connected Android device via adb devices", function() {
      expect(launcher._connected).to.be.true;
    });
  });

  describe("launch() with install", function() {
    it("installs and starts the hello world app", function() {
      return launcher.launch(HELLO_APP_ID, HELLO_APK)
        .then(() => Promise.all([isInstalled(HELLO_APP_ID), isRunning(HELLO_APP_ID)]))
        .then(([installed, running]) => {
          expect(installed, "app should be installed").to.be.true;
          expect(running, "app should be running").to.be.true;
        });
    });
  });

  describe("terminate()", function() {
    it("force-stops the running app", function() {
      return launcher.terminate(HELLO_APP_ID)
        .then(() => isRunning(HELLO_APP_ID))
        .then(running => expect(running, "app should not be running").to.be.false);
    });
  });
});
