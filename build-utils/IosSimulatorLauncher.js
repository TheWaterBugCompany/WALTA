import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";
import fs from "fs";
import path from "path";
import { Jimp } from "jimp";

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

// "com.apple.CoreSimulator.SimRuntime.iOS-26-3" -> "iOS 26.3"
function runtimeName(runtime) {
  const match = /SimRuntime\.([A-Za-z]+)-([0-9-]+)$/.exec(runtime);
  return match ? `${match[1]} ${match[2].replace(/-/g, ".")}` : runtime;
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

  // The simulator the captures were rendered on. A visual run is labelled by
  // whatever --device the caller typed ("local" by default), which says nothing
  // about what actually rendered it — so the run records this and the report
  // names it, and two runs from different simulators can't be read as one.
  async describeDevice() {
    const listed = JSON.parse(await this._exec(["simctl", "list", "devices", "-j"]));
    for (const [runtime, devices] of Object.entries(listed.devices)) {
      const device = devices.find((d) => d.udid === this._udid);
      if (device) { return `${device.name} · ${runtimeName(runtime)}`; }
    }
    return this._udid;
  }

  // Captures the actual simulator framebuffer (unlike toImage(), this includes
  // WebView / video / map content) and writes it upright-landscape to destPath.
  // The simulator screenshots in the device's physical portrait orientation, so
  // it's rotated to match the landscape-locked app.
  async screenshotFramebuffer(destPath) {
    // simctl resolves relative paths against its own cwd, not ours — pass absolute.
    const abs = path.resolve(destPath);
    const raw = `${abs}.portrait.png`;
    await this._exec(["simctl", "io", this._udid, "screenshot", raw]);
    const img = await Jimp.read(raw);
    img.rotate(90);
    await img.write(abs);
    fs.unlinkSync(raw);
    return abs;
  }

  // Copies the PNGs the visual-capture runner wrote to
  // <app-data-container>/Documents/<subdir> out to destDir, so the host can diff
  // them against baselines. Returns the destination paths.
  // The app's visual dir on the host filesystem — the simulator container is
  // directly readable/writable, which is what makes the file handshake possible
  // without any log-stream dependence. Cached: the container path is stable for
  // the life of an install.
  async _visualDir(appId, subdir = "visual") {
    if (!this._containerCache) {
      // Shorter timeout than the default: right after launch on a contended
      // runner get_app_container can hang; a tight timeout lets the caller poll
      // again quickly instead of burning 60s per attempt. Cached once resolved.
      this._containerCache = (await this._exec(["simctl", "get_app_container", this._udid, appId, "data"], { timeout: 15000 })).trim();
    }
    return path.join(this._containerCache, "Documents", subdir);
  }

  // List the handshake markers + PNGs the runner has written so far. Returns []
  // — not throwing — until the container resolves and the dir exists, so the
  // collector just polls again (get_app_container hanging early was the flake
  // that killed capture at the _exec timeout).
  async listVisualCaptureFiles(appId, { subdir = "visual" } = {}) {
    let dir;
    try {
      dir = await this._visualDir(appId, subdir);
    } catch (e) {
      return [];
    }
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir);
  }

  // Ack a captured screen by dropping an (empty) marker file the runner polls for.
  async writeVisualCaptureFile(appId, name, { subdir = "visual" } = {}) {
    const dir = await this._visualDir(appId, subdir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), "");
  }

  async pullCapturedScreenshots(appId, { subdir = "visual", destDir } = {}) {
    const container = (await this._exec(["simctl", "get_app_container", this._udid, appId, "data"])).trim();
    const srcDir = path.join(container, "Documents", subdir);
    fs.mkdirSync(destDir, { recursive: true });
    const pngs = fs.readdirSync(srcDir).filter((f) => f.endsWith(".png"));
    return pngs.map((f) => {
      const target = path.join(destDir, f);
      fs.copyFileSync(path.join(srcDir, f), target);
      return target;
    });
  }
}

export default IosSimulatorLauncher;
