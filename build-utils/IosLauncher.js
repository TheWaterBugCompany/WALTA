import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";
import { mkdtemp, readFile as defaultReadFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { createHash } from "crypto";
import iosDevice from "node-ios-device";

function computeLogPort(appId) {
  const sha1 = createHash('sha1').update(appId).digest('hex');
  return parseInt(sha1, 16) % 50000 + 10000;
}

class IosLauncher {
  constructor({ execFile = defaultExecFile, readFile = defaultReadFile, spawn = defaultSpawn, udid = null, appId = null } = {}) {
    this._execFile = execFile;
    this._readFile = readFile;
    this._spawn = spawn;
    this._udid = udid;
    this._logPort = appId ? computeLogPort(appId) : null;
    this._pid = null;
  }

  _exec(args) {
    return new Promise((resolve, reject) => {
      this._execFile("xcrun", args, (err, stdout) => err ? reject(err) : resolve(stdout));
    });
  }

  async connect() {
    if (this._udid) return this;
    const udid = await new Promise((resolve, reject) => {
      this._execFile("idevice_id", ["-l"], (err, stdout) => {
        if (err) return reject(new Error("No iOS device connected"));
        resolve(stdout.trim().split("\n").find(l => l.trim()) || null);
      });
    });
    if (!udid) throw new Error("No iOS device connected");
    this._udid = udid;
    return this;
  }

  async launch(appId, appPath) {
    await this.connect();
    if (appPath) {
      await this._exec(["devicectl", "device", "install", "app", "--device", this._udid, appPath]);
    }
    const tmpDir = await mkdtemp(join(tmpdir(), "devicectl-"));
    const jsonOut = join(tmpDir, "launch.json");
    try {
      await this._exec([
        "devicectl", "device", "process", "launch",
        "--json-output", jsonOut,
        "--device", this._udid,
        appId
      ]);
      const json = JSON.parse(await this._readFile(jsonOut, "utf-8"));
      this._pid = json.result.process.processIdentifier;
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }

  async terminate(_appId) {
    if (!this._pid) return;
    await this.connect();
    await this._exec([
      "devicectl", "device", "process", "terminate",
      "--device", this._udid,
      "--pid", String(this._pid)
    ]);
    this._pid = null;
  }

  streamLogs(onLine) {
    let handle = null;

    const tryConnect = () => {
      try {
        handle = iosDevice.forward(this._udid, this._logPort)
          .on('data', msg => {
            if (msg.startsWith('{"appId"')) return; // skip JSON header
            onLine(msg);
          });
      } catch (_err) {
        setTimeout(tryConnect, 1000);
      }
    };

    tryConnect();
    return () => handle && handle.stop();
  }

  getDriver() {
    return null;
  }
}

export default IosLauncher;
