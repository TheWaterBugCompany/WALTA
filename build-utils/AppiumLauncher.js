import { getCapabilities, startAppium as defaultStartAppium } from "../features/support/appium.js";

class AppiumLauncher {
  constructor(platform, { isSimulator = false, startAppium = defaultStartAppium, logPollInterval = 100 } = {}) {
    this.platform = platform;
    this.isSimulator = isSimulator;
    this._startAppium = startAppium;
    this._logPollInterval = logPollInterval;
    this._driver = null;
  }

  async connect(quick = false) {
    if (this._driver) return this._driver;
    const caps = await getCapabilities(this.platform, quick, 'local', null, null, this.isSimulator);
    this._driver = await this._startAppium(caps);
    return this._driver;
  }

  async launch(appId) {
    const driver = await this.connect(!this.isSimulator);
    await driver.activateApp(appId);
  }

  async terminate(appId) {
    const driver = await this.connect(true);
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

export default AppiumLauncher;
