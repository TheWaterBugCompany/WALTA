import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";

// Apple unified-log line format from `devicectl device process launch --console`:
//   "YYYY-MM-DD HH:MM:SS.sss ProcessName[pid:tid] message"
// Group 1 is the message portion; everything outside (devicectl's own
// "Acquired tunnel connection" chatter, blank lines) is dropped.
const LOG_LINE_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+ \S+\[\d+:\d+\]\s+(.*)$/;

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

class IosLauncher {
  constructor({ execFile = defaultExecFile, spawn = defaultSpawn, udid = null, appId = null } = {}) {
    this._execFile = execFile;
    this._spawn = spawn;
    this._udid = udid;
    this._appId = appId;
    // WB-76: launch() spawns `devicectl --console` and stores the proc here
    // so streamLogs() can attach listeners and terminate() can kill it. We
    // don't get/use a PID — killing devicectl propagates SIGTERM to the
    // app on the device through the console tunnel.
    this._consoleProc = null;
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

  // Launch the app with `devicectl --console` attached. iOS 14+ routes
  // Ti.API output through the unified logging system, which the legacy
  // BSD syslog stream (idevicesyslog / node-ios-device) can't see. The
  // vendor path is `process launch --console`, which combines launch +
  // stdout/stderr forwarding into a single long-running invocation.
  //
  // We don't ask for `--json-output` here (mutually-incompatible with
  // --console in the version we use). PID isn't needed either: killing
  // the spawned devicectl process propagates SIGTERM to the app on the
  // device through the console tunnel — see terminate().
  async launch(appId, appPath, launchArgs) {
    await this.connect();
    if (appPath) {
      await this._exec(["devicectl", "device", "install", "app", "--device", this._udid, appPath]);
    }
    const args = [
      "devicectl", "device", "process", "launch",
      "--terminate-existing",
      "--console",
      "--device", this._udid,
      appId,
      ...buildLaunchArgv(launchArgs),
    ];
    const proc = this._spawn("xcrun", args);
    this._consoleProc = proc;

    // Wait for devicectl to print the "Launched application" confirmation
    // before resolving. Anything emitted before then is devicectl's own
    // bootstrap chatter; anything emitted after is app output that
    // streamLogs() will pick up via its own data listener.
    await new Promise((resolve, reject) => {
      let bootstrapBuf = "";
      const onBootstrap = (chunk) => {
        bootstrapBuf += chunk.toString();
        if (bootstrapBuf.includes("Launched application with")) {
          proc.stdout.removeListener('data', onBootstrap);
          proc.removeListener('exit', onExit);
          resolve();
        }
      };
      const onExit = (code) => {
        proc.stdout.removeListener('data', onBootstrap);
        reject(new Error(`devicectl exited (code ${code}) before launch confirmation`));
      };
      proc.stdout.on('data', onBootstrap);
      proc.on('exit', onExit);
    });
  }

  async terminate(_appId) {
    if (!this._consoleProc) return;
    this._consoleProc.kill();
    this._consoleProc = null;
  }

  // Attach a parser to the running `devicectl --console` process started
  // by launch(). Returns a stop function that just detaches the listener;
  // it does NOT kill the process — terminate() owns the proc lifecycle.
  streamLogs(onLine, { logLevel = 'info' } = {}) {
    if (!this._consoleProc) throw new Error("launch() must be called before streamLogs()");

    const suppressedPrefixes = logLevel === 'trace' ? []
      : logLevel === 'debug' ? ['[TRACE]']
      : ['[TRACE]', '[DEBUG]']; // 'info' and above

    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString();
      // devicectl emits CRLF line endings; split on \r?\n so the trailing
      // \r doesn't break the LOG_LINE_RE match (JS `.` doesn't match \r).
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop(); // partial line — wait for newline
      for (const line of lines) {
        const m = line.match(LOG_LINE_RE);
        if (!m) continue;
        const msg = m[1];
        if (suppressedPrefixes.some(p => msg.startsWith(p))) continue;
        onLine(msg);
      }
    };

    const proc = this._consoleProc;
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);

    return () => {
      proc.stdout.removeListener('data', onData);
      proc.stderr.removeListener('data', onData);
    };
  }

  getDriver() {
    return null;
  }
}

export default IosLauncher;
