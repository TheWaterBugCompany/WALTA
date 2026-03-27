import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";
import path from "path";

function defaultAdb() {
  if (process.env.ANDROID_SDK_ROOT) {
    return path.join(process.env.ANDROID_SDK_ROOT, "platform-tools", "adb");
  }
  return "adb";
}

function exec(execFile, adb, args) {
  return new Promise((resolve, reject) => {
    execFile(adb, args, (err, stdout) => err ? reject(err) : resolve(stdout));
  });
}

class AndroidLauncher {
  constructor({ adb = defaultAdb(), execFile = defaultExecFile, spawn = defaultSpawn, activity = null, logTag = "TiAPI", logNoisePattern = /^Waterbug \d|^ti\.playservices:/ } = {}) {
    this._adb = adb;
    this._execFile = execFile;
    this._spawn = spawn;
    this._activity = activity;
    this._logTag = logTag;
    this._logNoisePattern = logNoisePattern;
    this._connected = false;
  }

  _exec(args) {
    return exec(this._execFile, this._adb, args);
  }

  async connect() {
    if (this._connected) return this;
    const output = await this._exec(["devices"]);
    const devices = output.split("\n").slice(1).filter(l => l.includes("\tdevice"));
    if (devices.length === 0) throw new Error("No Android device connected");
    this._connected = true;
    return this;
  }

  async launch(appId, apkPath) {
    await this.connect();
    if (apkPath) {
      await this._exec(["uninstall", appId]).catch(() => {});
      await this._exec(["install", "-r", apkPath]);
    }
    if (this._activity) {
      await this._exec(["shell", "am", "start", "-n", `${appId}/${this._activity}`]);
    } else {
      await this._exec(["shell", "am", "start", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", "-p", appId]);
    }
  }

  async terminate(appId) {
    await this.connect();
    await this._exec(["shell", "am", "force-stop", appId]);
  }

  streamLogs(onLine) {
    const proc = this._spawn(this._adb, ["logcat", "-s", `${this._logTag}:I`]);
    const logPattern = new RegExp(`${this._logTag}\\s*:\\s+(.*)`);
    let buffer = "";
    proc.stdout.on("data", data => {
      const lines = (buffer + data.toString()).split("\n");
      buffer = lines.pop();
      lines.forEach(line => {
        const match = line.match(logPattern);
        if (match && !this._logNoisePattern.test(match[1])) {
          onLine(match[1]);
        }
      });
    });
    return () => proc.kill();
  }

  getDriver() {
    return null;
  }
}

export default AndroidLauncher;
