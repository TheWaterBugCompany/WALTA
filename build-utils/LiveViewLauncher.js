import { spawn as defaultSpawn, execFile as defaultExecFile } from "child_process";
import http from "http";

const DEFAULT_PORT = 8323;
const READY_PATTERN = /\[LiveView\] Server ready/;
const PROBE_TIMEOUT_MS = 2000;

function defaultProbe(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on("error", reject);
    req.setTimeout(PROBE_TIMEOUT_MS, () => req.destroy(new Error("probe timeout")));
  });
}

class LiveViewLauncher {
  constructor({ port = DEFAULT_PORT, spawn = defaultSpawn, execFile = defaultExecFile, probe = defaultProbe, command = "./node_modules/.bin/titanium", args = [], env = {} } = {}) {
    this._port = port;
    this._spawn = spawn;
    this._execFile = execFile;
    this._probe = probe;
    this._command = command;
    this._args = args;
    this._env = env;
  }

  // Child env is the inherited process env with our overrides applied; an
  // override of `undefined` unsets the inherited key (e.g. clearing a
  // profile-level ANDROID_DEVICE_SERIAL so it can't pin adb to a device).
  _childEnv() {
    const env = { ...process.env, ...this._env };
    for (const key of Object.keys(this._env)) {
      if (this._env[key] === undefined) delete env[key];
    }
    return env;
  }

  isRunning() {
    return new Promise((resolve) => {
      this._execFile("lsof", ["-ti", `:${this._port}`], (err, stdout) => {
        resolve(!err && stdout.trim().length > 0);
      });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      const proc = this._spawn(this._command, this._args, {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: this._childEnv(),
      });

      proc.unref();

      let buffer = "";
      proc.stdout.on("data", (data) => {
        buffer += data.toString();
        if (READY_PATTERN.test(buffer)) {
          resolve();
        }
      });

      proc.on("close", (code) => {
        reject(new Error(`LiveView server exited with code ${code} before becoming ready`));
      });
    });
  }

  async isResponsive() {
    try {
      await this._probe(`http://127.0.0.1:${this._port}/`);
      return true;
    } catch {
      return false;
    }
  }

  async ensureRunning() {
    if (await this.isRunning()) {
      if (await this.isResponsive()) {
        return true;
      }
      await this.stop();
    }
    await this.start();
    return false;
  }

  stop() {
    return new Promise((resolve) => {
      this._execFile("lsof", ["-ti", `:${this._port}`], (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve();
          return;
        }
        const pid = stdout.trim();
        this._execFile("kill", ["-9", pid], () => resolve());
      });
    });
  }
}

export default LiveViewLauncher;
