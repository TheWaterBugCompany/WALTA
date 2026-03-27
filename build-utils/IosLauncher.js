import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";
import { mkdtemp, readFile as defaultReadFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

class IosLauncher {
  constructor({ execFile = defaultExecFile, readFile = defaultReadFile, spawn = defaultSpawn, deviceId = null, udid = null, logProcessName = "Waterbug(TitaniumKit)" } = {}) {
    this._execFile = execFile;
    this._readFile = readFile;
    this._spawn = spawn;
    this._deviceId = deviceId;
    this._udid = udid;
    this._logProcessName = logProcessName;
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
    const lines = output.split("\n").filter(l => l.includes("available") || l.includes("connected"));
    if (lines.length === 0) throw new Error("No iOS device connected");
    const line = lines.find(l => l.includes("connected")) || lines[0];
    const match = line.match(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i);
    if (!match) throw new Error("No iOS device connected");
    this._deviceId = match[0];
    this._udid = await new Promise((resolve) => {
      this._execFile("idevice_id", ["-l"], (err, stdout) =>
        resolve(err ? null : stdout.trim().split("\n").find(l => l.trim()) || null)
      );
    });
    return this;
  }

  async launch(appId, appPath) {
    await this.connect();
    if (appPath) {
      await this._exec(["devicectl", "device", "install", "app", "--device", this._deviceId, appPath]);
    }
    const tmpDir = await mkdtemp(join(tmpdir(), "devicectl-"));
    const jsonOut = join(tmpDir, "launch.json");
    try {
      await this._exec([
        "devicectl", "device", "process", "launch",
        "--json-output", jsonOut,
        "--device", this._deviceId,
        appId
      ]);
      const json = JSON.parse(await this._readFile(jsonOut, "utf-8"));
      this._pid = json.result.process.processIdentifier;
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
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

  streamLogs(onLine) {
    const args = this._udid ? ["-u", this._udid] : [];
    const proc = this._spawn("idevicesyslog", args);
    const logPattern = new RegExp(`${this._logProcessName.replace(/[()]/g, "\\$&")}.*?:\\s+(.*)`);
    let buffer = "";
    proc.stdout.on("data", data => {
      const lines = (buffer + data.toString()).split("\n");
      buffer = lines.pop();
      lines.forEach(line => {
        const match = line.match(logPattern);
        if (match) onLine(match[1]);
      });
    });
    return () => proc.kill();
  }

  getDriver() {
    return null;
  }
}

export default IosLauncher;
