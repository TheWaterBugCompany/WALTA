import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";
import fs from "fs";
import path from "path";
import * as tar from "tar";
import { Jimp } from "jimp";

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

  // Called when a run hangs with no log output. streamLogs filters to the
  // Titanium tag, so a crash or a process that never started leaves nothing
  // behind — these probes are the only record of which it was. Every probe is
  // best-effort: this runs on an already-failing path and must not mask it.
  async captureDiagnostics(appId) {
    await this.connect();
    const probes = [
      // pidof exits non-zero when nothing matches, so "the app never started"
      // — the signal we most want — arrives here as a command failure.
      { label: "app process", args: ["shell", "pidof", appId], whenFailed: "not running" },
      { label: "crash buffer", args: ["logcat", "-b", "crash", "-d", "-t", "50"] },
      // Filtered rather than the raw buffer: unfiltered logcat on an emulator is
      // almost entirely artd/gms chatter that buries anything relevant.
      { label: "errors + Titanium output", args: ["logcat", "-d", "-t", "100", "TiAPI:V", "AndroidRuntime:E", "*:E"] },
    ];

    const sections = [];
    for (const { label, args, whenFailed } of probes) {
      let body;
      try {
        body = (await this._exec(args)).trim() || "(empty)";
      } catch (err) {
        body = whenFailed || `probe failed: ${err.message}`;
      }
      sections.push(`--- ${label} ---\n${body}`);
    }
    return sections.join("\n");
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

  // Runs an adb command and resolves its raw stdout as a Buffer (execFile's
  // utf8 default would corrupt binary payloads like a tar stream).
  _execOutBinary(args) {
    const fullArgs = this._serial ? ["-s", this._serial, ...args] : args;
    return new Promise((resolve, reject) => {
      const proc = this._spawn(this._adb, fullArgs);
      const chunks = [];
      proc.stdout.on("data", (d) => chunks.push(Buffer.from(d)));
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0 || code === null) resolve(Buffer.concat(chunks));
        else reject(new Error(`adb ${args[0]} exited with code ${code}`));
      });
    });
  }

  // Captures the actual emulator framebuffer (includes WebView / video / map
  // content and the OS safe-area rendering, which toImage() can't show) to
  // destPath. The landscape-locked app rotates the emulator display to landscape,
  // so screencap already matches; if a frame comes back portrait we straighten it.
  async screenshotFramebuffer(destPath) {
    const png = await this._execOutBinary(["exec-out", "screencap", "-p"]);
    const abs = path.resolve(destPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const img = await Jimp.read(png);
    if (img.bitmap.height > img.bitmap.width) { img.rotate(90); }
    await img.write(abs);
    return abs;
  }

  // Pulls the visual-capture PNGs out of the app-private data dir. The dir isn't
  // world-readable, so `run-as` (which the debuggable test build permits) streams
  // it back as a tar archive — binary-safe and a single adb round-trip.
  // Locate the app-private visual dir (relative to run-as's cwd, the app data
  // dir) so the host can read/write handshake markers without the app reporting
  // its path over the log. Cached once the runner has created it.
  async _visualDir(appId, subdir = "visual") {
    if (this._visualDirCache) return this._visualDirCache;
    let out;
    try {
      out = (await this._exec(["exec-out", "run-as", appId, "find", ".", "-type", "d", "-name", subdir])).trim();
    } catch (e) {
      return null; // app dir not accessible yet
    }
    const rel = out.split("\n").map((s) => s.trim()).filter(Boolean)[0];
    if (rel) { this._visualDirCache = rel; }
    return rel || null;
  }

  async listVisualCaptureFiles(appId, { subdir = "visual" } = {}) {
    const dir = await this._visualDir(appId, subdir);
    if (!dir) return [];
    try {
      const out = await this._exec(["exec-out", "run-as", appId, "ls", "-1", dir]);
      return out.split("\n").map((s) => s.trim()).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  async writeVisualCaptureFile(appId, name, { subdir = "visual" } = {}) {
    const dir = await this._visualDir(appId, subdir);
    if (!dir) throw new Error(`visual dir not found for ${appId}`);
    // run-as sh runs on the device; ': > file' truncates/creates an empty file.
    await this._exec(["exec-out", "run-as", appId, "sh", "-c", `: > ${dir}/${name}`]);
  }

  async pullCapturedScreenshots(appId, { deviceDir, destDir } = {}) {
    const dir = deviceDir ? String(deviceDir).replace(/^file:\/\//, "") : (await this._visualDir(appId));
    const tarBuffer = await this._execOutBinary(["exec-out", "run-as", appId, "tar", "c", "-C", dir, "."]);
    fs.mkdirSync(destDir, { recursive: true });
    const tmpTar = path.join(destDir, ".pull.tar");
    fs.writeFileSync(tmpTar, tarBuffer);
    await tar.x({ file: tmpTar, cwd: destDir });
    fs.unlinkSync(tmpTar);
    // The tar carries the whole visual dir, including the .ready/.shot/capture-done
    // handshake markers — drop them so the uploaded artifact is just screenshots.
    for (const f of fs.readdirSync(destDir)) {
      if (!f.endsWith(".png")) { fs.rmSync(path.join(destDir, f), { force: true }); }
    }
    return fs.readdirSync(destDir)
      .filter((f) => f.endsWith(".png"))
      .map((f) => path.join(destDir, f));
  }
}

export default AndroidLauncher;
