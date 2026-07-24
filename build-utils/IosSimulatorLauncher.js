import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";

function buildLaunchArgv(launchArgs) {
  if (!launchArgs) return [];
  const argv = [];
  for (const key of Object.keys(launchArgs)) {
    const value = launchArgs[key];
    if (typeof value === "boolean") {
      argv.push(`-${key}`, value ? "true" : "false");
    } else if (value !== undefined && value !== null) {
      argv.push(`-${key}`, String(value));
    }
  }
  return argv;
}

class IosSimulatorLauncher {
  constructor({ execFile = defaultExecFile, spawn = defaultSpawn, udid = null, logProcessName = "Waterbug(TitaniumKit)", sleep = (ms) => new Promise(r => setTimeout(r, ms)) } = {}) {
    this._execFile = execFile;
    this._spawn = spawn;
    this._udid = udid;
    this._logProcessName = logProcessName;
    this._sleep = sleep;
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
    // A contended runner can fail `simctl boot` with a fatal that lands before
    // cucumber runs — so it exits 1, not the EX_TEMPFAIL (75) the CI shell's
    // infra retry looks for, and the whole job fails needing a manual re-run.
    // Retry a bounded number of times ("already booted" is success), then wait
    // for bootstatus so install/launch don't race a half-booted sim.
    const MAX_ATTEMPTS = 3;
    let lastErr = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await this._exec(["simctl", "boot", this._udid]);
        lastErr = null;
        break;
      } catch (err) {
        if (/Unable to boot device in current state/.test(err.message)) { lastErr = null; break; }
        lastErr = err;
        if (attempt < MAX_ATTEMPTS) await this._sleep(2000);
      }
    }
    if (lastErr) throw lastErr;
    await this._exec(["simctl", "bootstatus", this._udid], { timeout: 180000 });
    this._booted = true;
    return this;
  }

  async launch(appId, appPath, launchArgs) {
    await this.connect();
    // Generous timeouts: on a cold CI runner the first install/launch can take
    // 60-90s while CoreSimulator's lazy services (installd, FrontBoard, etc.)
    // warm up. The default 60s _exec timeout was killing simctl mid-launch.
    if (appPath) {
      await this._exec(["simctl", "install", this._udid, appPath], { timeout: 180000 });
    }
    const argv = buildLaunchArgv(launchArgs);
    // Match the Android `-S` behaviour — when launch args are present we
    // want a fresh JS runtime so the spec runner re-evaluates with the new
    // arguments rather than handing them to the running process's onNewIntent
    // equivalent.
    const terminateFlags = argv.length > 0 ? ["--terminate-running-process"] : [];
    const simctlArgs = ["simctl", "launch", ...terminateFlags, this._udid, appId, ...argv];
    const MAX_ATTEMPTS = 3;
    let stdout;
    let lastErr = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        stdout = await this._exec(simctlArgs, { timeout: 180000 });
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        // Real launch errors (bad bundle id, missing app) surface immediately;
        // only timeouts are worth retrying.
        if (!err.killed) throw err;
        if (attempt === MAX_ATTEMPTS) break;
        // Clean up any half-launched app state before the next attempt —
        // CoreSimulator's lazy services (installd / FrontBoard / launchd)
        // sometimes leave the app in a stuck state after a timeout, which
        // then blocks the next launch. `simctl terminate` is a no-op if
        // the app isn't running.
        await this._exec(["simctl", "terminate", this._udid, appId]).catch(() => {});
      }
    }
    if (lastErr) throw lastErr;
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
