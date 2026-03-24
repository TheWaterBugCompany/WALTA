const { getCapabilities, startAppium: defaultStartAppium } = require("../features/support/appium");

class AppiumLauncher {
  constructor(platform, { isSimulator = false, startAppium = defaultStartAppium } = {}) {
    this.platform = platform;
    this.isSimulator = isSimulator;
    this._startAppium = startAppium;
    this._driver = null;
  }

  connect(quick = false) {
    if (this._driver) return Promise.resolve(this._driver);
    return getCapabilities(this.platform, quick, 'local', null, null, this.isSimulator)
      .then(caps => this._startAppium(caps))
      .then(driver => { this._driver = driver; return driver; });
  }

  launch(appId) {
    return this.connect(!this.isSimulator)
      .then(driver => driver.activateApp(appId));
  }

  terminate(appId) {
    return this.connect(true)
      .then(driver => driver.terminateApp(
        this.platform === "android" ? appId : undefined,
        this.platform === "ios" ? appId : undefined
      ));
  }

  getDriver() {
    return this._driver;
  }
}

module.exports = AppiumLauncher;
