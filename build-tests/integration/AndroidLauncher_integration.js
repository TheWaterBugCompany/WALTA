import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { expect } from "chai";
import AndroidLauncher from "../../build-utils/AndroidLauncher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

async function isInstalled(appId) {
  const out = await adb("shell", "pm", "list", "packages", appId);
  return out.trim().includes(`package:${appId}`);
}

async function isRunning(appId) {
  try {
    const out = await adb("shell", "pidof", appId);
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

describe("AndroidLauncher (integration)", function() {
  this.timeout(30000);

  let launcher;

  before(async function() {
    launcher = new AndroidLauncher({ activity: HELLO_ACTIVITY });
    try {
      await launcher.connect();
    } catch {
      this.skip();
    }
  });

  after(async function() {
    await adb("uninstall", HELLO_APP_ID).catch(() => {});
  });

  describe("connect()", function() {
    it("finds a connected Android device via adb devices", function() {
      expect(launcher._connected).to.be.true;
    });
  });

  describe("launch() with install", function() {
    it("installs and starts the hello world app", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APK);
      expect(await isInstalled(HELLO_APP_ID), "app should be installed").to.be.true;
      expect(await isRunning(HELLO_APP_ID), "app should be running").to.be.true;
    });
  });

  describe("terminate()", function() {
    it("force-stops the running app", async function() {
      await launcher.terminate(HELLO_APP_ID);
      expect(await isRunning(HELLO_APP_ID), "app should not be running").to.be.false;
    });
  });
});
