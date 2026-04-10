import { spawn as defaultSpawn } from "child_process";

class CucumberLauncher {
  constructor({ tags = "@only", appiumOptions = {}, spawn = defaultSpawn } = {}) {
    this._tags = tags;
    this._appiumOptions = appiumOptions;
    this._spawn = spawn;
  }

  run() {
    const child = this._spawn(
      "npx",
      ["cucumber-js", "--tags", this._tags],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          PATH: `./node_modules/.bin/:${process.env.PATH}`,
          APPIUM_OPTIONS: JSON.stringify(this._appiumOptions),
        },
      }
    );
    return new Promise((resolve) => {
      child.on("exit", (code) => resolve(code));
    });
  }
}

export default CucumberLauncher;
