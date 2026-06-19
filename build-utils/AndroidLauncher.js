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

// Single-quote a string for `adb shell` to preserve it as a single
// token. `adb shell <args...>` joins the args with spaces and runs the
// result as a shell command on the device, so an unquoted value with
// spaces gets re-tokenised — `am start --es test_grep "renders Logger
// lines"` becomes `am start --es test_grep renders Logger lines`,
// which makes `am start` interpret `Logger` as the next positional
// and silently drop subsequent extras (including `--ez unit_test
// true`). Standard POSIX single-quote escape: `'` → `'\''`.
function shellQuote(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

function buildIntentExtras(launchArgs) {
  if (!launchArgs) return [];
  const flags = [];
  for (const key of Object.keys(launchArgs)) {
    const value = launchArgs[key];
    if (typeof value === "boolean") {
      flags.push("--ez", key, value ? "true" : "false");
    } else if (value !== undefined && value !== null) {
      flags.push("--es", key, shellQuote(value));
    }
  }
  return flags;
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
    this._serial = null;
  }

  _exec(args) {
    const fullArgs = this._serial ? ["-s", this._serial, ...args] : args;
    return exec(this._execFile, this._adb, fullArgs);
  }

  async connect() {
    if (this._connected) return this;
    if (!this._serial) {
      const output = await exec(this._execFile, this._adb, ["devices"]);
      const devices = output.split("\n").slice(1).filter(l => l.includes("\tdevice"));
      if (devices.length === 0) throw new Error("No Android device connected");
      this._serial = devices[0].split("\t")[0].trim();
    }
    this._connected = true;
    return this;
  }

  async launch(appId, apkPath, launchArgs) {
    await this.connect();
    // Keep screen on while USB-connected to prevent lock-mode test failures
    await this._exec(["shell", "svc", "power", "stayon", "usb"]).catch(() => {});
    await this._exec(["shell", "input", "keyevent", "KEYCODE_WAKEUP"]).catch(() => {});
    if (apkPath) {
      // Reinstall in place (-r) and grant all manifest runtime permissions (-g).
      // No uninstall: it would wipe runtime grants, so the freshly-installed app
      // requests a permission at boot, the system GrantPermissionsActivity dialog
      // opens, and `am start -W` waits forever for an "idle" the dialog never
      // lets it reach — wedging the launch. (App state is reset separately via
      // `pm clear` in the test harness.) -g re-grants on every reinstall.
      await this._exec(["install", "-r", "-g", apkPath]);
    }
    await this._exec(["logcat", "-c"]);
    const extras = buildIntentExtras(launchArgs);
    // `-S` force-stops the app before starting so JS re-runs and any new
    // intent extras are picked up at spec-runner init — otherwise `am start`
    // on a live process only delivers onNewIntent and index.js isn't re-evaluated.
    // `-W` makes `am start` wait until the launch completes so the integration
    // test's `pidof` check doesn't race against an Activity that's still
    // spawning its process.
    const startFlags = extras.length > 0 ? ["-S", "-W"] : ["-W"];
    if (this._activity) {
      await this._exec(["shell", "am", "start", ...startFlags, "-n", `${appId}/${this._activity}`, ...extras]);
    } else {
      await this._exec(["shell", "am", "start", ...startFlags, "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", "-p", appId, ...extras]);
    }
  }

  async terminate(appId) {
    await this.connect();
    await this._exec(["shell", "am", "force-stop", appId]);
  }

  streamLogs(onLine) {
    const serialArgs = this._serial ? ["-s", this._serial] : [];
    const proc = this._spawn(this._adb, [...serialArgs, "logcat", "-s", `${this._logTag}:I`]);
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
