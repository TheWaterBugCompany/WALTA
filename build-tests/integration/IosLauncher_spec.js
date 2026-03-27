import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { expect } from "chai";
import IosLauncher from "../../build-utils/IosLauncher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HELLO_APP_V1 = path.join(__dirname, "fixtures/HelloWorld-ios/v1/HelloWorld.app");
const HELLO_APP_V2 = path.join(__dirname, "fixtures/HelloWorld-ios/v2/HelloWorld.app");
const HELLO_APP_ID = "com.example.helloworld";

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

async function isRunning(udid, pid) {
  try {
    const out = await devicectl("device", "info", "processes",
      "--device", udid,
      "--filter", `processIdentifier == ${pid}`
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
    launcher = new IosLauncher();
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
      expect(launcher._pid, "PID should be stored").to.be.a("number");
    });

    it("installs the updated app when a newer build is launched", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V2);
      expect(await installedBundleVersion(launcher._udid, HELLO_APP_ID), "bundle version should be updated to 2").to.equal(2);
      expect(await isRunning(launcher._udid, launcher._pid), "updated app should be running").to.be.true;
    });
  });

  describe("streamLogs()", function() {
    it("connects to idevicesyslog and receives device log output", async function() {
      this.timeout(20000);
      // Use a broad pattern to match any syslog process — iOS 14+ restricts user app NSLog
      // visibility in the old syslog stream. Filter logic is covered by unit tests.
      const logLauncher = new IosLauncher({ logProcessName: ".+", udid: launcher._udid });
      const lines = await new Promise((resolve, reject) => {
        let settled = false;
        const collected = [];
        const stop = logLauncher.streamLogs(line => {
          collected.push(line);
          if (collected.length >= 1 && !settled) { settled = true; stop(); resolve(collected); }
        });
        setTimeout(() => { if (!settled) { settled = true; stop(); reject(new Error("No log lines received within timeout")); } }, 15000);
      });
      expect(lines.length).to.be.greaterThan(0);
    });
  });

  describe("terminate()", function() {
    it("terminates the running app", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V1);
      if (!launcher._pid) throw new Error("launch() must have succeeded before terminate() can be tested");
      const pid = launcher._pid;
      await launcher.terminate(HELLO_APP_ID);
      expect(await isRunning(launcher._udid, pid), "app should not be running").to.be.false;
    });
  });
});
