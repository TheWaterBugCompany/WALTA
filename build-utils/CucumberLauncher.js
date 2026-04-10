import { spawn as defaultSpawn } from "child_process";

class CucumberLauncher {
  constructor({ tags = "@only", env = {}, spawn = defaultSpawn } = {}) {
    this._tags = tags;
    this._env = env;
    this._spawn = spawn;
  }

  run() {
    const child = this._spawn(
      "npx",
      ["cucumber-js", "--tags", this._tags],
      { stdio: "inherit", env: { ...process.env, ...this._env } }
    );
    return new Promise((resolve) => {
      child.on("exit", (code) => resolve(code));
    });
  }
}

export default CucumberLauncher;
