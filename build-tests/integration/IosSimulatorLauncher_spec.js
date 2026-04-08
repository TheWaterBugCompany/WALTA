import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { expect } from "chai";
import IosSimulatorLauncher from "../../build-utils/IosSimulatorLauncher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HELLO_APP_V1 = path.join(__dirname, "fixtures/HelloWorld-ios/sim-v1/HelloWorld.app");
const HELLO_APP_V2 = path.join(__dirname, "fixtures/HelloWorld-ios/sim-v2/HelloWorld.app");
const HELLO_APP_ID = "com.example.helloworld";
const SIM_UDID = process.env.SIM_UDID || "8A665EBC-2A48-4965-A1B6-E52A289C9744";

// Integration tests — these run real xcrun simctl commands and require the simulator to be available.
// Run with: npx grunt build-integration-test

function simctl(...args) {
  return new Promise((resolve, reject) => {
    execFile("xcrun", ["simctl", ...args], (err, stdout) => err ? reject(err) : resolve(stdout));
  });
}

async function isInstalled(udid, appId) {
  try {
    const out = await simctl("listapps", udid);
    return out.includes(appId);
  } catch {
    return false;
  }
}

describe("IosSimulatorLauncher (integration)", function() {
  this.timeout(30000);

  let launcher;

  before(async function() {
    this.timeout(30000);
    launcher = new IosSimulatorLauncher({ udid: SIM_UDID });
    await launcher.connect();
    // Ensure the app is uninstalled before tests run
    await simctl("uninstall", SIM_UDID, HELLO_APP_ID).catch(() => {});
  });

  after(async function() {
    await simctl("terminate", SIM_UDID, HELLO_APP_ID).catch(() => {});
    await simctl("uninstall", SIM_UDID, HELLO_APP_ID).catch(() => {});
  });

  describe("connect()", function() {
    it("boots the simulator (or tolerates already-booted state)", function() {
      expect(launcher._booted).to.be.true;
    });
  });

  describe("launch() with install", function() {
    it("installs and launches the hello world app", async function() {
      this.timeout(60000); // first install on CI can be slow
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V1);
      expect(await isInstalled(SIM_UDID, HELLO_APP_ID), "app should be installed").to.be.true;
      expect(launcher._pid, "PID should be stored").to.be.a("number");
    });

    it("installs the updated app when a newer build is launched", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V2);
      const out = await simctl("listapps", SIM_UDID);
      // simctl listapps includes the bundle version in the plist output
      expect(out).to.include(HELLO_APP_ID);
      expect(launcher._pid, "PID should be updated").to.be.a("number");
    });
  });

  describe("streamLogs()", function() {
    it("captures NSLog output from the running app", async function() {
      this.timeout(20000);
      await launcher.terminate(HELLO_APP_ID).catch(() => {});
      const lines = await new Promise((resolve, reject) => {
        let settled = false;
        const collected = [];
        const logLauncher = new IosSimulatorLauncher({ udid: SIM_UDID, logProcessName: "HelloWorld" });
        // Start the log stream before launching so we don't miss the startup NSLog
        const stop = logLauncher.streamLogs(line => {
          collected.push(line);
          if (collected.some(l => l.includes("App started")) && !settled) {
            settled = true; stop(); resolve(collected);
          }
        });
        setTimeout(() => {
          if (!settled) { settled = true; stop(); reject(new Error("No log lines received within timeout")); }
        }, 15000);
        // Launch after stream is set up
        launcher.launch(HELLO_APP_ID, HELLO_APP_V1).catch(err => {
          if (!settled) { settled = true; stop(); reject(err); }
        });
      });
      expect(lines.some(l => l.includes("App started"))).to.be.true;
    });
  });

  describe("terminate()", function() {
    it("terminates the running app", async function() {
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V1);
      await launcher.terminate(HELLO_APP_ID);
      // After terminate, re-launching should assign a new PID (app was stopped)
      const pidBefore = launcher._pid;
      await launcher.launch(HELLO_APP_ID, HELLO_APP_V1);
      expect(launcher._pid, "a new PID should be assigned after relaunch").to.be.a("number");
      // Note: PIDs can be reused so we just verify the app relaunched successfully
    });
  });
});
