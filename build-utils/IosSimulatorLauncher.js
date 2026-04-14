import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";

class IosSimulatorLauncher {
  constructor({ execFile = defaultExecFile, spawn = defaultSpawn, udid = null, logProcessName = "Waterbug(TitaniumKit)" } = {}) {
    this._execFile = execFile;
    this._spawn = spawn;
    this._udid = udid;
    this._logProcessName = logProcessName;
    this._booted = false;
    this._pid = null;
  }

  _exec(args, { timeout = 60000 } = {}) {
    return new Promise((resolve, reject) => {
      this._execFile("xcrun", args, { timeout }, (err, stdout, stderr) => {
        if (err) {
          if (stderr) err.message += `\nstderr: ${stderr.trim()}`;
          reject(err);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async connect() {
    if (this._booted) return this;
    if (!this._udid) throw new Error("IosSimulatorLauncher requires a udid");
    try {
      await this._exec(["simctl", "boot", this._udid]);
    } catch (err) {
      if (!/Unable to boot device in current state/.test(err.message)) throw err;
    }
    this._booted = true;
    return this;
  }

  async launch(appId, appPath) {
    await this.connect();
    // Generous timeouts: on a cold CI runner the first install/launch can take
    // 60-90s while CoreSimulator's lazy services (installd, FrontBoard, etc.)
    // warm up. The default 60s _exec timeout was killing simctl mid-launch.
    if (appPath) {
      await this._exec(["simctl", "install", this._udid, appPath], { timeout: 180000 });
    }
    const stdout = await this._exec(["simctl", "launch", this._udid, appId], { timeout: 180000 });
    const match = stdout.match(/:\s*(\d+)/);
    this._pid = match ? parseInt(match[1], 10) : null;
  }

  async terminate(appId) {
    try {
      await this._exec(["simctl", "terminate", this._udid, appId]);
    } catch (_err) {
      // App may not be running — swallow
    }
  }

  streamLogs(onLine, { logLevel = 'info' } = {}) {
    const suppressedPrefixes = logLevel === 'trace' ? []
      : logLevel === 'debug' ? ['[TRACE]']
      : ['[TRACE]', '[DEBUG]']; // 'info' and above

    const proc = this._spawn("xcrun", ["simctl", "spawn", this._udid, "log", "stream", "--style", "syslog"]);
    const escapedName = this._logProcessName.replace(/[()]/g, "\\$&");
    // Old format: "Name(Lib)[PID] <Level>: message"
    const oldPattern = new RegExp(`${escapedName}[^:]*:\\s+(.*)`);
    // New format (iOS 17+): "Name[PID]: (Lib) [subsystem] message"
    const baseName = this._logProcessName.split("(")[0];
    const libMatch = this._logProcessName.match(/\(([^)]+)\)/);
    const newPattern = libMatch
      ? new RegExp(`${baseName}\\[\\d+\\]:\\s+\\(${libMatch[1]}\\)(?:\\s+\\[[^\\]]+\\])?\\s+(.*)`)
      : new RegExp(`${baseName}\\[\\d+\\]:\\s+(.*)`);

    let buffer = "";
    proc.stdout.on("data", data => {
      const lines = (buffer + data.toString()).split("\n");
      buffer = lines.pop();
      lines.forEach(line => {
        const match = line.match(oldPattern) || line.match(newPattern);
        if (!match) return;
        const msg = match[1].replace(/\\\^\[/g, "\x1b");
        if (suppressedPrefixes.some(p => msg.startsWith(p))) return;
        onLine(msg);
      });
    });
    return () => proc.kill();
  }

  getDriver() {
    return null;
  }
}

export default IosSimulatorLauncher;
