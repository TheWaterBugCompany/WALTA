import { getCapabilities, startAppium as defaultStartAppium } from "../features/support/appium.js";

class AppiumLauncher {
  constructor(platform, { isSimulator = false, host = 'local', kobitonVersion = null, startAppium = defaultStartAppium, logPollInterval = 100 } = {}) {
    this.platform = platform;
    this.isSimulator = isSimulator;
    this.host = host;
    this.kobitonVersion = kobitonVersion;
    this._startAppium = startAppium;
    this._logPollInterval = logPollInterval;
    this._driver = null;
  }

  async connect() {
    if (this._driver) return this._driver;
    const caps = await getCapabilities(this.platform, this.host, this.kobitonVersion, null, this.isSimulator);
    this._driver = await this._startAppium(caps, this.host);
    return this._driver;
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

export default AppiumLauncher;
