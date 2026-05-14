import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";
import { mkdtemp, readFile as defaultReadFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

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
  constructor({ execFile = defaultExecFile, readFile = defaultReadFile, spawn = defaultSpawn, udid = null, appId = null } = {}) {
    this._execFile = execFile;
    this._readFile = readFile;
    this._spawn = spawn;
    this._udid = udid;
    this._appId = appId;
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

  async launch(appId, appPath, launchArgs) {
    await this.connect();
    if (appPath) {
      await this._exec(["devicectl", "device", "install", "app", "--device", this._udid, appPath]);
    }
    const tmpDir = await mkdtemp(join(tmpdir(), "devicectl-"));
    const jsonOut = join(tmpDir, "launch.json");
    const argv = buildLaunchArgv(launchArgs);
    // `--terminate-existing` forces a fresh JS runtime when launch args are
    // present so the spec runner re-evaluates with the new NSUserDefaults
    // values; otherwise devicectl delivers the args to the existing process.
    const terminateFlags = argv.length > 0 ? ["--terminate-existing"] : [];
    try {
      await this._exec([
        "devicectl", "device", "process", "launch",
        "--json-output", jsonOut,
        ...terminateFlags,
        "--device", this._udid,
        appId,
        ...argv
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

  // Launch the app with `devicectl --console` so its stdout/stderr stream
  // back. WB-76: this replaces the old node-ios-device port-forward path
  // because iOS 14+ routes Ti.API output through the unified logging
  // system, which is invisible to the legacy BSD syslog stream.
  // `--terminate-existing` is mandatory — `--console` only attaches at
  // launch, so any already-running instance must be killed first.
  streamLogs(onLine, { logLevel = 'info', launchArgs } = {}) {
    if (!this._appId) throw new Error("IosLauncher was constructed without an appId — streamLogs needs it to launch the app");
    if (!this._udid) throw new Error("connect() must succeed before streamLogs() can be called");

    const suppressedPrefixes = logLevel === 'trace' ? []
      : logLevel === 'debug' ? ['[TRACE]']
      : ['[TRACE]', '[DEBUG]']; // 'info' and above

    const args = [
      "devicectl", "device", "process", "launch",
      "--terminate-existing",
      "--console",
      "--device", this._udid,
      this._appId,
      ...buildLaunchArgv(launchArgs),
    ];

    const proc = this._spawn("xcrun", args);

    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop(); // partial line — wait for newline
      for (const line of lines) {
        const m = line.match(LOG_LINE_RE);
        if (!m) continue;
        const msg = m[1];
        if (suppressedPrefixes.some(p => msg.startsWith(p))) continue;
        onLine(msg);
      }
    };

    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);

    return () => proc.kill();
  }

  getDriver() {
    return null;
  }
}

export default IosLauncher;
