import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { expect } from "chai";
import IosLauncher from "../../build-utils/IosLauncher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HELLO_APP_V1 = path.join(__dirname, "fixtures/HelloWorld-ios/v1/HelloWorld.app");
const HELLO_APP_V2 = path.join(__dirname, "fixtures/HelloWorld-ios/v2/HelloWorld.app");
const HELLO_APP_ID = "com.example.helloworld";
const DEVICE_UDID = process.env.DEVICE_UDID || null;

// Integration tests — these run real devicectl commands and require a connected iOS device.
// Run with: npx grunt build-integration-test

function devicectl(...args) {
  return new Promise((resolve, reject) => {
    execFile("xcrun", ["devicectl", ...args], (err, stdout) => err ? reject(err) : resolve(stdout));
  });
}

async function isInstalled(udid, appId) {
  try {
    const out = await devicectl("device", "info", "apps",
      "--device", udid,
      "--filter", `bundleID == "${appId}"`
    );
    return out.includes(appId);
  } catch {
    return false;
  }
}

async function isProcessRunning(udid, executableName) {
  try {
    const out = await devicectl("device", "info", "processes",
      "--device", udid,
      "--filter", `executable.path contains "${executableName}"`
    );
    const tableLines = out.trim().split("\n").filter(l => !/^\d+:\d+:\d+/.test(l));
    return tableLines.length > 2; // header + separator + at least one row
  } catch {
    return false;
  }
}

async function installedBundleVersion(udid, appId) {
  const out = await devicectl("device", "info", "apps",
    "--device", udid,
    "--filter", `bundleID == "${appId}"`
  );
  // Output columns: Name  Bundle Identifier  Version  Bundle Version
  const line = out.split("\n").find(l => l.includes(appId));
  if (!line) return null;
  const parts = line.trim().split(/\s+/);
  return parseInt(parts[parts.length - 1], 10);
}

describe("IosLauncher (integration)", function() {
  this.timeout(60000);

  let launcher;

  before(async function() {
    this.timeout(15000);
    launcher = new IosLauncher({ udid: DEVICE_UDID, appId: HELLO_APP_ID });
    await launcher.connect();
  });

  describe("connect()", function() {
    it("finds a connected iOS device via idevice_id", function() {
      expect(launcher._udid).to.be.a("string").and.have.length.greaterThan(0);
    });
  });

  describe("launch() with install", function() {
    it("installs and launches the hello world app", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V1);
      expect(await isInstalled(launcher._udid, HELLO_APP_ID), "app should be installed").to.be.true;
      expect(await isProcessRunning(launcher._udid, "HelloWorld"), "app should be running").to.be.true;
      await launcher.terminate();
    });

    it("installs the updated app when a newer build is launched", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V2);
      expect(await installedBundleVersion(launcher._udid, HELLO_APP_ID), "bundle version should be updated to 2").to.equal(2);
      expect(await isProcessRunning(launcher._udid, "HelloWorld"), "updated app should be running").to.be.true;
      await launcher.terminate();
    });
  });

  describe("streamLogs()", function() {
    // WB-76: launch() now attaches `devicectl --console` to capture iOS 14+
    // unified-logging output; streamLogs() subscribes to the already-running
    // devicectl process. No second launch.
    it("captures NSLog output from the launched app", async function() {
      this.timeout(30000);
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V1);
      const collected = [];
      const lines = await new Promise((resolve, reject) => {
        let settled = false;
        const stop = launcher.streamLogs(line => {
          collected.push(line);
          if (line.includes("App started") && !settled) {
            settled = true; stop(); resolve(collected);
          }
        });
        setTimeout(() => {
          if (!settled) { settled = true; stop(); reject(new Error(`No "App started" line received within timeout. Got: ${JSON.stringify(collected.slice(0, 20))}`)); }
        }, 25000);
      });
      expect(lines.some(l => l.includes("App started"))).to.be.true;
      await launcher.terminate();
    });
  });

  describe("terminate()", function() {
    it("terminates the running app", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V1);
      expect(await isProcessRunning(launcher._udid, "HelloWorld"), "app should be running pre-terminate").to.be.true;
      await launcher.terminate(HELLO_APP_ID);
      // Give devicectl a moment to propagate the kill before checking.
      await new Promise(r => setTimeout(r, 1000));
      expect(await isProcessRunning(launcher._udid, "HelloWorld"), "app should not be running post-terminate").to.be.false;
    });
  });
});
