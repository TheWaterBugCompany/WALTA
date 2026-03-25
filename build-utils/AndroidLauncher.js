import { execFile as defaultExecFile } from "child_process";
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
  constructor({ adb = defaultAdb(), execFile = defaultExecFile, activity = null } = {}) {
    this._adb = adb;
    this._execFile = execFile;
    this._activity = activity;
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

  getDriver() {
    return null;
  }
}

export default AndroidLauncher;
