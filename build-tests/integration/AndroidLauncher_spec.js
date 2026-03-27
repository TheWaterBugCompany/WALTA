import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { expect } from "chai";
import AndroidLauncher from "../../build-utils/AndroidLauncher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HELLO_APK_V1 = path.join(__dirname, "fixtures/HelloWorld-android/hello-v1.apk");
const HELLO_APK_V2 = path.join(__dirname, "fixtures/HelloWorld-android/hello-v2.apk");
const HELLO_APP_ID = "com.example.helloworld";
const HELLO_ACTIVITY = ".MainActivity";

// Integration tests — these run real adb commands and require a connected device.
// Run with: npx grunt build-integration-test

function adb(serial, ...args) {
  return new Promise((resolve, reject) => {
    execFile("adb", ["-s", serial, ...args], (err, stdout) => err ? reject(err) : resolve(stdout));
  });
}

async function isInstalled(serial, appId) {
  const out = await adb(serial, "shell", "pm", "list", "packages", appId);
  return out.trim().includes(`package:${appId}`);
}

async function isRunning(serial, appId) {
  try {
    const out = await adb(serial, "shell", "pidof", appId);
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

async function installedVersionCode(serial, appId) {
  const out = await adb(serial, "shell", "dumpsys", "package", appId);
  const match = out.match(/versionCode=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

describe("AndroidLauncher (integration)", function() {
  this.timeout(30000);

  let launcher, serial;

  before(async function() {
    launcher = new AndroidLauncher({ activity: HELLO_ACTIVITY });
    await launcher.connect();
    serial = launcher._serial;
  });

  after(async function() {
    await adb(serial, "uninstall", HELLO_APP_ID).catch(() => {});
  });

  describe("connect()", function() {
    it("finds a connected Android device via adb devices", function() {
      expect(launcher._connected).to.be.true;
    });
  });

  describe("launch() with install", function() {
    it("installs and starts the hello world app", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APK_V1);
      expect(await isInstalled(serial, HELLO_APP_ID), "app should be installed").to.be.true;
      expect(await isRunning(serial, HELLO_APP_ID), "app should be running").to.be.true;
    });

    it("installs the updated app when a newer build is launched", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APK_V2);
      expect(await installedVersionCode(serial, HELLO_APP_ID), "version should be updated to v2").to.equal(2);
      expect(await isRunning(serial, HELLO_APP_ID), "updated app should be running").to.be.true;
    });
  });

  describe("streamLogs()", function() {
    it("receives log lines emitted by the running app", async function() {
      this.timeout(15000);
      const logLauncher = new AndroidLauncher({ activity: HELLO_ACTIVITY, logTag: "HelloWorld", logNoisePattern: /(?!)/ });
      await logLauncher.launch(HELLO_APP_ID, HELLO_APK_V1);
      const lines = await new Promise((resolve, reject) => {
        let settled = false;
        const collected = [];
        const stop = logLauncher.streamLogs(line => {
          collected.push(line);
          if (collected.length >= 1 && !settled) { settled = true; stop(); resolve(collected); }
        });
        setTimeout(() => { if (!settled) { settled = true; stop(); reject(new Error("No log lines received within timeout")); } }, 10000);
      });
      expect(lines[0]).to.include("App started");
      await logLauncher.terminate(HELLO_APP_ID);
    });
  });

  describe("terminate()", function() {
    it("force-stops the running app", async function() {
      await launcher.terminate(HELLO_APP_ID);
      expect(await isRunning(serial, HELLO_APP_ID), "app should not be running").to.be.false;
    });
  });
});
