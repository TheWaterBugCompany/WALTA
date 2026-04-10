import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { expect } from "chai";
import AndroidEmulatorLauncher from "../../build-utils/AndroidEmulatorLauncher.js";
import AppiumLauncher from "../../build-utils/AppiumLauncher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HELLO_APK = path.join(__dirname, "fixtures/HelloWorld-android/hello-v1.apk");
const HELLO_APP_ID = "com.example.helloworld";
const HELLO_ACTIVITY = ".MainActivity";

function adb(serial, ...args) {
  return new Promise((resolve, reject) => {
    execFile("adb", ["-s", serial, ...args], (err, stdout) => err ? reject(err) : resolve(stdout));
  });
}

// Integration tests — these boot an Android emulator, install the HelloWorld
// fixture app, then verify AppiumLauncher can auto-start the appium server,
// create a session, interact with the running app, and clean up.
//
// Run with: npx grunt exec:build_integration_test_android

describe("AppiumLauncher (integration — Android emulator)", function () {
  this.timeout(120000);

  let emulator, serial, launcher;

  before(async function () {
    // Kill any existing appium server so we exercise the auto-start path
    const { execSync } = await import("child_process");
    try { execSync("pkill -f 'appium'", { stdio: 'ignore' }); } catch { /* none running */ }
    await new Promise(r => setTimeout(r, 1000));

    // Boot the emulator and install + launch the fixture app
    emulator = new AndroidEmulatorLauncher({ activity: HELLO_ACTIVITY });
    await emulator.connect();
    serial = emulator._inner._serial;
    await emulator.launch(HELLO_APP_ID, HELLO_APK);
  });

  after(async function () {
    if (launcher) await launcher.stop();
    await adb(serial, "shell", "am", "force-stop", HELLO_APP_ID).catch(() => {});
    await adb(serial, "uninstall", HELLO_APP_ID).catch(() => {});
  });

  it("auto-starts the appium server and creates a session", async function () {
    launcher = new AppiumLauncher("android", {
      isSimulator: true,
      appId: HELLO_APP_ID,
      appActivity: HELLO_ACTIVITY,
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
