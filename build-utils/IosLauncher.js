import { execFile as defaultExecFile } from "child_process";

class IosLauncher {
  constructor({ execFile = defaultExecFile, deviceId = null } = {}) {
    this._execFile = execFile;
    this._deviceId = deviceId;
    this._pid = null;
  }

  _exec(args) {
    return new Promise((resolve, reject) => {
      this._execFile("xcrun", args, (err, stdout) => err ? reject(err) : resolve(stdout));
    });
  }

  async connect() {
    if (this._deviceId) return this;
    const output = await this._exec(["devicectl", "list", "devices"]);
    const line = output.split("\n").find(l => l.includes("available"));
    if (!line) throw new Error("No iOS device connected");
    const match = line.match(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i);
    if (!match) throw new Error("No iOS device connected");
    this._deviceId = match[0];
    return this;
  }

  async launch(appId, appPath) {
    await this.connect();
    if (appPath) {
      await this._exec(["devicectl", "device", "install", "app", "--device", this._deviceId, appPath]);
    }
    const output = await this._exec([
      "devicectl", "device", "process", "launch",
      "--json-output", "/dev/stdout",
      "--device", this._deviceId,
      appId
    ]);
    this._pid = JSON.parse(output).result.process.processIdentifier;
  }

  async terminate(appId) {
    if (!this._pid) return;
    await this.connect();
    await this._exec([
      "devicectl", "device", "process", "terminate",
      "--device", this._deviceId,
      "--pid", String(this._pid)
    ]);
    this._pid = null;
  }

  getDriver() {
    return null;
  }
}

export default IosLauncher;
