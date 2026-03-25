const { execFile: defaultExecFile } = require("child_process");
const path = require("path");

function defaultAdb() {
  if (process.env.ANDROID_SDK_ROOT) {
    return path.join(process.env.ANDROID_SDK_ROOT, "platform-tools", "adb");
  }
  return "adb";
}

class AndroidLauncher {
  constructor({ adb = defaultAdb(), execFile = defaultExecFile, activity = null } = {}) {
    this._adb = adb;
    this._execFile = execFile;
    this._activity = activity;
    this._connected = false;
  }

  _exec(args) {
    return new Promise((resolve, reject) => {
      this._execFile(this._adb, args, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });
  }

  connect() {
    if (this._connected) return Promise.resolve(this);
    return this._exec(["devices"]).then(output => {
      const devices = output.split("\n").slice(1).filter(l => l.includes("\tdevice"));
      if (devices.length === 0) throw new Error("No Android device connected");
      this._connected = true;
      return this;
    });
  }

  launch(appId, apkPath) {
    return this.connect()
      .then(() => apkPath ? this._exec(["uninstall", appId]).catch(() => {}) : Promise.resolve())
      .then(() => apkPath ? this._exec(["install", "-r", apkPath]) : Promise.resolve())
      .then(() => this._activity
        ? this._exec(["shell", "am", "start", "-n", `${appId}/${this._activity}`])
        : this._exec(["shell", "am", "start", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", "-p", appId]));
  }

  terminate(appId) {
    return this.connect().then(() =>
      this._exec(["shell", "am", "force-stop", appId])
    );
  }

  getDriver() {
    return null;
  }
}

module.exports = AndroidLauncher;
