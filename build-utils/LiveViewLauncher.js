import { spawn as defaultSpawn, execFile as defaultExecFile } from "child_process";

const DEFAULT_PORT = 8323;
const READY_PATTERN = /\[LiveView\] Server ready/;

class LiveViewLauncher {
  constructor({ port = DEFAULT_PORT, spawn = defaultSpawn, execFile = defaultExecFile, command = "./node_modules/.bin/titanium", args = [] } = {}) {
    this._port = port;
    this._spawn = spawn;
    this._execFile = execFile;
    this._command = command;
    this._args = args;
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

  async ensureRunning() {
    if (await this.isRunning()) {
      return true;
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
