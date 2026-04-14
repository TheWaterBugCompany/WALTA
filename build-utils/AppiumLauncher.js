import { remote as defaultRemote } from "webdriverio";
import { spawn as defaultSpawn } from "child_process";
import http from "http";
import _ from "underscore";

function defaultIsAppiumRunning() {
  return new Promise((resolve) => {
    http.get('http://localhost:4723/status', () => resolve(true))
      .on('error', () => resolve(false));
  });
}

function defaultKillProcess(pid) {
  // Negative pid kills the entire process group (needed because _ensureServer
  // spawns appium with detached:true, giving it its own process group).
  try { process.kill(-pid, 'SIGTERM'); } catch (e) { /* already gone */ }
}

class AppiumLauncher {
  constructor(platform, {
    isSimulator = false, host = 'local', kobitonVersion = null,
    appId = 'net.thewaterbug.waterbug', appActivity = '.WaterbugActivity',
    startAppium = null, remote = defaultRemote, logPollInterval = 100,
    spawn = defaultSpawn, isAppiumRunning = defaultIsAppiumRunning,
    killProcess = defaultKillProcess,
  } = {}) {
    this.platform = platform;
    this.isSimulator = isSimulator;
    this.host = host;
    this.kobitonVersion = kobitonVersion;
    this.appId = appId;
    this.appActivity = appActivity;
    this._remote = remote;
    // Legacy injection point — if startAppium is provided, use it instead
    // of the built-in _createSession. Allows tests to inject a fake.
    this._startAppium = startAppium;
    this._logPollInterval = logPollInterval;
    this._spawn = spawn;
    this._isAppiumRunning = isAppiumRunning;
    this._killProcess = killProcess;
    this._driver = null;
    this._serverPid = null;
  }

  _buildCapabilities() {
    const caps = {};

    if (this.host === "kobiton") {
      Object.assign(caps, {
        sessionName: 'Automation test session',
        sessionDescription: '',
        captureScreenshots: true,
        browserName: 'chrome',
        deviceGroup: 'KOBITON',
        app: `kobiton-store:v${this.kobitonVersion}`
      });

      if (this.platform === "android") {
        Object.assign(caps, { autoGrantPermissions: true, platformName: 'Android' });
      } else if (this.platform === "ios") {
        Object.assign(caps, { platformName: 'iOS' });
      }

      Object.assign(caps, { platformVersion: '*', deviceName: '*' });
      return caps;
    }

    if (this.platform === "ios") {
      Object.assign(caps, {
        "appium:automationName": "XCUITest",
        "platformName": "iOS",
        "appium:autoAcceptAlerts": true,
        "appium:waitForQuiescence": false,
        "appium:useJSONSource": true,
        "appium:showXcodeLog": true,
        "appium:usePrebuiltWDA": false,
        // WDA is built from source on the first run (~2-3 min on CI),
        // so override the 60s default WDA launch/connection timeouts.
        "appium:wdaLaunchTimeout": 300000,
        "appium:wdaConnectionTimeout": 300000,
        "appium:bundleId": this.appId,
        "appium:noReset": true,
        "appium:autoLaunch": false,
        "appium:processArguments": { "args": ["-FIRDebugEnabled"] }
      });
      if (this.isSimulator) {
        if (!process.env.SIM_UDID) {
          throw new Error("SIM_UDID environment variable must be set for iOS simulator runs");
        }
        Object.assign(caps, {
          "appium:deviceName": "iPhone Simulator",
          "appium:udid": process.env.SIM_UDID,
        });
      } else {
        Object.assign(caps, {
          "appium:platformVersion": "12.4",
          "appium:deviceName": "The Code Sharman Test iPhone",
          "appium:udid": "auto",
          "appium:xcodeOrgId": "6RRED3LUUV",
          "appium:xcodeSigningId": "Apple Development",
        });
      }
    } else if (this.platform === "android") {
      Object.assign(caps, {
        "appium:automationName": "uiautomator2",
        "platformName": "Android",
        "appium:autoGrantPermissions": true,
        "appium:appActivity": this.appActivity,
        "appium:appWaitActivity": this.appActivity,
        "appium:newCommandTimeout": 0,
        "appium:appPackage": this.appId,
        "appium:noReset": true,
        "appium:autoLaunch": false,
        "appium:skipDeviceInitialization": false,
        "appium:skipServerInstallation": false,
      });
      if (this.isSimulator) {
        Object.assign(caps, { "appium:avdName": "Medium_Phone_API_36.1" });
      }
    }
    return caps;
  }

  async _createSession(caps) {
    if (this.host === 'kobiton') {
      return this._remote({
        protocol: 'https',
        port: 443,
        hostname: 'api.kobiton.com',
        user: 'thecodesharman',
        key: '<<<SECRET>>>',
        capabilities: caps,
        logLevel: 'error'
      });
    }
    return this._remote({
      logLevel: 'error',
      hostname: 'localhost',
      port: 4723,
      capabilities: caps
    });
  }

  async _ensureServer() {
    if (this.host !== 'local') return;
    const running = await this._isAppiumRunning();
    if (running) return;

    // DIAGNOSTIC: pipe appium stdio so its logs surface in CI output.
    const child = this._spawn('npx', ['appium'], {
      stdio: 'inherit',
      detached: true,
    });
    child.unref();
    this._serverPid = child.pid;

    // Poll until the server responds (up to 30s)
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await this._isAppiumRunning()) return;
    }
    throw new Error('Appium server failed to start within 30s');
  }

  async connect() {
    if (this._driver) return this._driver;
    await this._ensureServer();
    const caps = this._buildCapabilities();
    this._driver = this._startAppium
      ? await this._startAppium(caps, this.host)
      : await this._createSession(caps);
    process.once('SIGINT', () => {
      if (this._driver) this._driver.deleteSession().catch(() => {}).finally(() => process.exit(0));
    });
    return this._driver;
  }

  async stop() {
    if (this._driver) {
      await this._driver.deleteSession();
      this._driver = null;
    }
    if (this._serverPid) {
      this._killProcess(this._serverPid);
      this._serverPid = null;
    }
  }

  async launch(appId) {
    const driver = await this.connect();
    await driver.activateApp(appId);
  }

  async terminate(appId) {
    const driver = await this.connect();
    await driver.terminateApp(
      this.platform === "android" ? appId : undefined,
      this.platform === "ios" ? appId : undefined
    );
  }

  streamLogs(onLine) {
    let stopped = false;
    const poll = async () => {
      while (!stopped) {
        const logs = await this._driver.getLogs("syslog");
        logs.forEach(entry => onLine(entry.message));
        await new Promise(r => setTimeout(r, this._logPollInterval));
      }
    };
    poll();
    return () => { stopped = true; };
  }

  getDriver() {
    return this._driver;
  }
}

export { defaultIsAppiumRunning as isAppiumRunning };
export default AppiumLauncher;
