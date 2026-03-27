import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { expect } from "chai";
import AndroidEmulatorLauncher from "../../build-utils/AndroidEmulatorLauncher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HELLO_APK_V1 = path.join(__dirname, "fixtures/HelloWorld-android/hello-v1.apk");
const HELLO_APK_V2 = path.join(__dirname, "fixtures/HelloWorld-android/hello-v2.apk");
const HELLO_APP_ID = "com.example.helloworld";
const HELLO_ACTIVITY = ".MainActivity";

// Integration tests — these require an AVD to be configured (or an emulator already running).
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

async function isRunning(serial, appId, { retries = 5, intervalMs = 500 } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const out = await adb(serial, "shell", "pidof", appId);
      if (out.trim().length > 0) return true;
    } catch { /* not running yet */ }
    if (i < retries - 1) await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

async function installedVersionCode(serial, appId) {
  const out = await adb(serial, "shell", "dumpsys", "package", appId);
  const match = out.match(/versionCode=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

describe("AndroidEmulatorLauncher (integration)", function() {
  this.timeout(180000);

  let launcher, serial;

  before(async function() {
    this.timeout(120000);
    launcher = new AndroidEmulatorLauncher({ activity: HELLO_ACTIVITY });
    await launcher.connect();
    serial = launcher._inner._serial;
    await adb(serial, "uninstall", HELLO_APP_ID).catch(() => {});
  });

  after(async function() {
    await adb(serial, "uninstall", HELLO_APP_ID).catch(() => {});
  });

  describe("connect()", function() {
    it("connects to a running emulator (starting one if needed)", function() {
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
      const logLauncher = new AndroidEmulatorLauncher({ activity: HELLO_ACTIVITY, logTag: "HelloWorld", logNoisePattern: /(?!)/ });
      await logLauncher.connect();
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
