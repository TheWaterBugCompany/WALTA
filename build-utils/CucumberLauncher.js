import { spawn as defaultSpawn } from "child_process";
import { isAppiumRunning as defaultIsAppiumRunning } from "./AppiumLauncher.js";

class CucumberLauncher {
  constructor({
    tags = "not @skip", name = null, appiumOptions = {}, spawn = defaultSpawn,
    isAppiumRunning = defaultIsAppiumRunning, killProcess = null,
  } = {}) {
    this._tags = tags;
    this._name = name;
    this._appiumOptions = appiumOptions;
    this._spawn = spawn;
    this._isAppiumRunning = isAppiumRunning;
    this._killProcess = killProcess || ((pid) => {
      try { process.kill(-pid, 'SIGTERM'); } catch (e) { /* already gone */ }
    });
    this._serverPid = null;
  }

  async _ensureServer() {
    if (await this._isAppiumRunning()) return;
    const child = this._spawn('npx', ['appium'], {
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
    this._serverPid = child.pid;

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await this._isAppiumRunning()) return;
    }
    throw new Error('Appium server failed to start within 30s');
  }

  _stopServer() {
    if (this._serverPid) {
      this._killProcess(this._serverPid);
      this._serverPid = null;
    }
  }

  async run() {
    await this._ensureServer();

    const code = await new Promise((resolve) => {
      const child = this._spawn(
        "npx",
        [
          "cucumber-js", "--tags", this._tags,
          ...(this._name ? ["--name", this._name] : []),
          "--force-exit",
        ],
        {
          stdio: "inherit",
          env: {
            ...process.env,
            PATH: `./node_modules/.bin/:${process.env.PATH}`,
            APPIUM_OPTIONS: JSON.stringify(this._appiumOptions),
          },
        }
      );
      child.on("exit", (code) => resolve(code));
    });

    this._stopServer();
    return code;
  }
}

export default CucumberLauncher;
