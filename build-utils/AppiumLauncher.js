import { remote as defaultRemote } from "webdriverio";
import { spawn as defaultSpawn } from "child_process";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import _ from "underscore";

// Resolve the locally-installed appium binary relative to this file
// (build-utils/AppiumLauncher.js → ../node_modules/.bin/appium). Going
// direct skips the ~8 min npx resolution overhead seen on macOS-15 CI
// runners — see WB-49.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_APPIUM_BIN = path.resolve(__dirname, "..", "node_modules", ".bin", "appium");

function defaultIsAppiumRunning() {
  return new Promise((resolve) => {
    http.get('http://localhost:4723/status', () => resolve(true))
      .on('error', () => resolve(false));
  });
}

// Raw `am start` argument string used both by the session-startup
// capability `appium:optionalIntentArguments` and by the per-launch
// `mobile: startActivity` call. Using the same string format on both
// paths avoids the array-of-tuples `extras` format whose cross-version
// reliability under uiautomator2 we don't trust.
function buildOptionalIntentArguments(launchArgs) {
  if (!launchArgs) return undefined;
  const parts = [];
  for (const key of Object.keys(launchArgs)) {
    const value = launchArgs[key];
    if (typeof value === "boolean") {
      parts.push("--ez", key, value ? "true" : "false");
    } else if (value !== undefined && value !== null) {
      parts.push("--es", key, String(value));
    }
  }
  return parts.length ? parts.join(" ") : undefined;
}

// iOS equivalent: launch argv `-key value` pairs are auto-merged into
// NSUserDefaults by iOS, which alloy.js reads via Ti.App.Properties.
// Single-dash format mirrors IosSimulatorLauncher.buildLaunchArgv.
function buildIosProcessArgs(launchArgs) {
  if (!launchArgs) return [];
  const args = [];
  for (const key of Object.keys(launchArgs)) {
    const value = launchArgs[key];
    if (typeof value === "boolean") {
      args.push(`-${key}`, value ? "true" : "false");
    } else if (value !== undefined && value !== null) {
      args.push(`-${key}`, String(value));
    }
  }
  return args;
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
    launchArgs = null,
    startAppium = null, remote = defaultRemote, logPollInterval = 100,
    spawn = defaultSpawn, isAppiumRunning = defaultIsAppiumRunning,
    killProcess = defaultKillProcess,
    appiumBin = DEFAULT_APPIUM_BIN,
    // Match the 600s connectionRetryTimeout used for cold WDA builds —
    // the macOS-15 runner has been seen taking ~8 min just to print
    // appium's first stdout. 30s was too aggressive.
    serverStartTimeoutMs = 300_000,
  } = {}) {
    this.platform = platform;
    this.isSimulator = isSimulator;
    this.host = host;
    this.kobitonVersion = kobitonVersion;
    this.appId = appId;
    this.appActivity = appActivity;
    this.launchArgs = launchArgs;
    this._remote = remote;
    // Legacy injection point — if startAppium is provided, use it instead
    // of the built-in _createSession. Allows tests to inject a fake.
    this._startAppium = startAppium;
    this._logPollInterval = logPollInterval;
    this._spawn = spawn;
    this._isAppiumRunning = isAppiumRunning;
    this._killProcess = killProcess;
    this._appiumBin = appiumBin;
    this._serverStartTimeoutMs = serverStartTimeoutMs;
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
      const wdaDerivedPath = process.env.WDA_DERIVED_DATA_PATH;
      const iosArgs = buildIosProcessArgs(this.launchArgs);
      Object.assign(caps, {
        "appium:automationName": "XCUITest",
        "platformName": "iOS",
        // System sheets (e.g. iOS "Save Password?") are dismissed
        // explicitly in BaseScreen.clickRaw — auto-dismiss could race
        // with the explicit handling.
        "appium:waitForQuiescence": false,
        "appium:useJSONSource": true,
        "appium:showXcodeLog": true,
        "appium:usePrebuiltWDA": !!wdaDerivedPath,
        // WDA is built from source on the first run (~2-3 min on CI),
        // so override the 60s default WDA launch/connection timeouts.
        "appium:wdaLaunchTimeout": 300000,
        "appium:wdaConnectionTimeout": 300000,
        "appium:bundleId": this.appId,
        "appium:noReset": true,
        "appium:autoLaunch": false,
        "appium:processArguments": { "args": iosArgs }
      });
      if (wdaDerivedPath) {
        caps["appium:derivedDataPath"] = wdaDerivedPath;
      }
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
      const optionalIntentArguments = buildOptionalIntentArguments(this.launchArgs);
      Object.assign(caps, {
        "appium:automationName": "uiautomator2",
        "platformName": "Android",
        "appium:autoGrantPermissions": true,
        "appium:appActivity": this.appActivity,
        // Titanium swaps the launch activity for `org.appcelerator.titanium.TiActivity`
        // at runtime, so the launcher activity is never the foreground activity.
        // Wildcard so Appium considers any activity in our package "started".
        "appium:appWaitActivity": "*",
        "appium:newCommandTimeout": 0,
        "appium:appPackage": this.appId,
        "appium:noReset": true,
        "appium:forceAppLaunch": true,
        "appium:skipDeviceInitialization": false,
        "appium:skipServerInstallation": false,
      });
      if (optionalIntentArguments) {
        caps["appium:optionalIntentArguments"] = optionalIntentArguments;
      }
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
      // Allow plenty of time for cold WDA builds on CI runners — the
      // default connectionRetryTimeout of 120s expires while xcodebuild
      // is still compiling WebDriverAgent on the first run.
      connectionRetryTimeout: 600000,
      connectionRetryCount: 1,
      capabilities: caps
    });
  }

  async _ensureServer() {
    if (this.host !== 'local') return;
    const running = await this._isAppiumRunning();
    if (running) return;

    // DIAGNOSTIC: pipe appium stdio so its logs surface in CI output.
    const child = this._spawn(this._appiumBin, [], {
      stdio: 'inherit',
      detached: true,
    });
    child.unref();
    this._serverPid = child.pid;

    const pollIntervalMs = 500;
    const maxAttempts = Math.max(1, Math.ceil(this._serverStartTimeoutMs / pollIntervalMs));
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, pollIntervalMs));
      if (await this._isAppiumRunning()) return;
    }
    throw new Error(`Appium server failed to start within ${this._serverStartTimeoutMs / 1000}s`);
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

  async launch(appId, launchArgs) {
    const driver = await this.connect();
    if (this.platform === "android") {
      // Bypass Appium's `mobile: startActivity` for the launch — its
      // `optionalIntentArguments` parameter is silently ignored under
      // uiautomator2 (verified empirically: per-scenario re-launches
      // arrive with `intent.getStringExtra("cerdiServerUrl") == null`).
      // Drop straight to `adb shell am start -S` instead; -S force-stops
      // the app first so JS re-runs at init and Alloy.CFG picks up new
      // extras, and `am start` honours --es directly.
      const adbBin = process.env.ANDROID_SDK_ROOT
        ? `${process.env.ANDROID_SDK_ROOT}/platform-tools/adb`
        : "adb";
      const args = ["shell", "am", "start", "-W", "-S",
        "-n", `${appId}/${this.appActivity}`];
      const extras = buildOptionalIntentArguments(launchArgs);
      if (extras) args.push(...extras.split(" "));
      await new Promise((resolve, reject) => {
        const child = this._spawn(adbBin, args, { stdio: "inherit" });
        child.on("close", (code) => code === 0
          ? resolve()
          : reject(new Error(`adb am start exited ${code}`)));
        child.on("error", reject);
      });
    } else if (this.platform === "ios") {
      // XCUITest's mobile: launchApp passes process arguments through to
      // the running app where alloy.js can read them via Ti.App.arguments.
      await driver.execute("mobile: launchApp", {
        bundleId: appId,
        arguments: buildIosProcessArgs(launchArgs),
      });
    } else {
      await driver.activateApp(appId);
    }
  }

  async setLocation(lat, lng) {
    let bin, args;
    if (this.platform === "android") {
      bin = process.env.ANDROID_SDK_ROOT
        ? `${process.env.ANDROID_SDK_ROOT}/platform-tools/adb`
        : "adb";
      // adb emu geo fix takes longitude first, then latitude — opposite
      // of simctl's lat,lng order. The emulator's AndroidLocationManager
      // forwards this to Ti.Geolocation listeners.
      args = ["emu", "geo", "fix", String(lng), String(lat)];
    } else if (this.platform === "ios") {
      if (!process.env.SIM_UDID) {
        throw new Error("SIM_UDID environment variable must be set for iOS setLocation");
      }
      bin = "xcrun";
      args = ["simctl", "location", process.env.SIM_UDID, "set", `${lat},${lng}`];
    } else {
      return;
    }
    await new Promise((resolve, reject) => {
      const child = this._spawn(bin, args, { stdio: "inherit" });
      child.on("close", (code) => code === 0
        ? resolve()
        : reject(new Error(`${bin} ${args.join(" ")} exited ${code}`)));
      child.on("error", reject);
    });
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
