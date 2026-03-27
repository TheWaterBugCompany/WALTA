import { execFile as defaultExecFile, spawn as defaultSpawn } from "child_process";
import path from "path";
import AndroidLauncher from "./AndroidLauncher.js";

function defaultAdb() {
  if (process.env.ANDROID_SDK_ROOT) {
    return path.join(process.env.ANDROID_SDK_ROOT, "platform-tools", "adb");
  }
  return "adb";
}

function defaultEmulatorBin() {
  if (process.env.ANDROID_SDK_ROOT) {
    return path.join(process.env.ANDROID_SDK_ROOT, "emulator", "emulator");
  }
  return "emulator";
}

function exec(execFile, cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err, stdout) => err ? reject(err) : resolve(stdout));
  });
}

class AndroidEmulatorLauncher {
  constructor({
    avdName = "Medium_Phone_API_36.1",
    adb = defaultAdb(),
    emulatorBin = defaultEmulatorBin(),
    execFile = defaultExecFile,
    spawn = defaultSpawn,
    activity = null,
    logTag = "TiAPI",
    logNoisePattern = /^Waterbug \d|^ti\.playservices:/,
    bootTimeoutMs = 120000,
    bootPollIntervalMs = 2000,
    innerLauncher = null
  } = {}) {
    this._avdName = avdName;
    this._adb = adb;
    this._emulatorBin = emulatorBin;
    this._execFile = execFile;
    this._spawn = spawn;
    this._bootTimeoutMs = bootTimeoutMs;
    this._bootPollIntervalMs = bootPollIntervalMs;
    this._connected = false;
    this._emulatorProc = null;
    this._inner = innerLauncher || new AndroidLauncher({ adb, execFile, spawn, activity, logTag, logNoisePattern });
  }

  async connect() {
    if (this._connected) return this;
    const output = await exec(this._execFile, this._adb, ["devices"]);
    const emulatorRunning = output.split("\n").some(l => /emulator-\d+\tdevice/.test(l));
    if (!emulatorRunning) {
      await this._bootEmulator();
    }
    await this._inner.connect();
    this._connected = true;
    return this;
  }

  async _bootEmulator() {
    this._emulatorProc = this._spawn(this._emulatorBin, ["-avd", this._avdName, "-no-boot-anim", "-no-audio"]);
    await exec(this._execFile, this._adb, ["wait-for-device"]);
    await this._waitForBoot();
  }

  _waitForBoot() {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      const poll = () => {
        if (Date.now() - start > this._bootTimeoutMs) {
          return reject(new Error(`Android emulator did not finish booting within ${this._bootTimeoutMs}ms`));
        }
        exec(this._execFile, this._adb, ["shell", "getprop", "sys.boot_completed"])
          .then(out => {
            if (out.trim() === "1") {
              resolve();
            } else {
              setTimeout(poll, this._bootPollIntervalMs);
            }
          })
          .catch(() => setTimeout(poll, this._bootPollIntervalMs));
      };
      poll();
    });
  }

  launch(appId, apkPath) { return this._inner.launch(appId, apkPath); }
  terminate(appId) { return this._inner.terminate(appId); }
  streamLogs(onLine) { return this._inner.streamLogs(onLine); }
  getDriver() { return null; }
}

export default AndroidEmulatorLauncher;
