import path from "path";
import { fileURLToPath } from "url";
import { expect } from "chai";
import IosSimulatorLauncher from "../../build-utils/IosSimulatorLauncher.js";
import AppiumLauncher from "../../build-utils/AppiumLauncher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HELLO_APP = path.join(__dirname, "fixtures/HelloWorld-ios/sim-v1/HelloWorld.app");
const HELLO_APP_ID = "com.example.helloworld";
const SIM_UDID = process.env.SIM_UDID || "8A665EBC-2A48-4965-A1B6-E52A289C9744";

// Integration tests — these boot the iOS simulator via IosSimulatorLauncher,
// install the HelloWorld fixture app, then verify AppiumLauncher can auto-start
// the appium server, create a session, interact with the running app, and clean up.
//
// Run with: SIM_UDID=<udid> npx grunt exec:build_integration_test_ios

describe("AppiumLauncher (integration — iOS simulator)", function () {
  this.timeout(120000);

  let simulator, launcher;

  before(async function () {
    // Kill any existing appium server so we exercise the auto-start path
    const { execSync } = await import("child_process");
    try { execSync("pkill -f 'appium'", { stdio: 'ignore' }); } catch { /* none running */ }
    await new Promise(r => setTimeout(r, 1000));

    // Boot the simulator and install + launch the fixture app
    simulator = new IosSimulatorLauncher({ udid: SIM_UDID });
    await simulator.connect();
    await simulator.launch(HELLO_APP_ID, HELLO_APP);
  });

  after(async function () {
    if (launcher) await launcher.stop();
    await simulator.terminate(HELLO_APP_ID).catch(() => {});
  });

  it("auto-starts the appium server and creates a session", async function () {
    launcher = new AppiumLauncher("ios", {
      isSimulator: true,
      appId: HELLO_APP_ID,
    });
    const driver = await launcher.connect();
    expect(driver).to.exist;
    expect(launcher._serverPid, "should have started the appium server").to.be.a("number");
  });

  it("can interact with the running app via appium", async function () {
    const driver = launcher.getDriver();

    // Verify the initial label text
    const label = await driver.$('~greeting');
    expect(await label.getText()).to.equal("Hello World");

    // Tap the button
    const button = await driver.$('~tapButton');
    await button.click();

    // Verify the label changed
    expect(await label.getText()).to.equal("Tapped!");
  });

  it("stops the session and kills the appium server", async function () {
    expect(launcher._serverPid, "server pid should be set").to.be.a("number");
    await launcher.stop();
    expect(launcher._driver, "driver should be cleared").to.be.null;
    expect(launcher._serverPid, "server pid should be cleared").to.be.null;

    // Allow a moment for the server to shut down, then verify the port is free
    await new Promise(r => setTimeout(r, 2000));
    const http = await import("http");
    const serverGone = await new Promise(resolve => {
      http.default.get('http://localhost:4723/status', () => resolve(false))
        .on('error', () => resolve(true));
    });
    expect(serverGone, "appium server should no longer be listening on 4723").to.be.true;
  });
});
