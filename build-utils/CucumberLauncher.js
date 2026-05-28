import { spawn as defaultSpawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { isAppiumRunning as defaultIsAppiumRunning } from "./AppiumLauncher.js";

// Direct binary path — npx resolution adds ~8 min cold-start latency on
// macOS-15 CI runners.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_APPIUM_BIN = path.resolve(__dirname, "..", "node_modules", ".bin", "appium");

// BSD sysexits.h — "temporary failure, indicating something that is not
// really an error... the request should be reattempted later." Used to
// signal CI that this run never reached test execution (Appium connect
// refused, BeforeAll crash, sim/WDA not ready, etc.) and is retry-eligible,
// distinct from a real test or config failure.
const EX_TEMPFAIL = 75;

// Cucumber-js prints a summary line like "1 scenario (1 passed)" or
// "7 scenarios (5 failed, 2 passed)" once at least one scenario has
// completed (formatter-independent — appears in both progress and pretty
// output). If cucumber-js exits without ever emitting this line, no
// scenarios ran.
const SCENARIOS_SUMMARY = /\d+ scenarios? \(/;

class CucumberLauncher {
  constructor({
    tags = "not @skip", name = null, appiumOptions = {}, spawn = defaultSpawn,
    isAppiumRunning = defaultIsAppiumRunning, killProcess = null,
    appiumBin = DEFAULT_APPIUM_BIN, serverStartTimeoutMs = 300_000,
  } = {}) {
    this._tags = tags;
    this._name = name;
    this._appiumOptions = appiumOptions;
    this._spawn = spawn;
    this._isAppiumRunning = isAppiumRunning;
    this._killProcess = killProcess || ((pid) => {
      try { process.kill(-pid, 'SIGTERM'); } catch (e) { /* already gone */ }
    });
    this._appiumBin = appiumBin;
    this._serverStartTimeoutMs = serverStartTimeoutMs;
    this._serverPid = null;
  }

  async _ensureServer() {
    if (await this._isAppiumRunning()) return;
    // Log to a file at debug so the WDA/xcode trace (showXcodeLog) survives —
    // stdio is ignored, so without --log the appium output is lost and a hung
    // driver command can't be pinpointed. failure-diagnostics captures the file.
    const child = this._spawn(this._appiumBin, ['--log', './appium.log', '--log-level', 'info:debug'], {
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
    this._serverPid = child.pid;

    const pollIntervalMs = 500;
    const maxAttempts = Math.max(1, Math.ceil(this._serverStartTimeoutMs / pollIntervalMs));
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, pollIntervalMs));
      if (await this._isAppiumRunning()) return;
    }
    throw new Error(`Appium server failed to start within ${this._serverStartTimeoutMs / 1000}s`);
  }

  _stopServer() {
    if (this._serverPid) {
      this._killProcess(this._serverPid);
      this._serverPid = null;
    }
  }

  async run() {
    await this._ensureServer();

    const code = await new Promise((resolve) => {
      const child = this._spawn(
        "npx",
        [
          "cucumber-js", "--tags", this._tags,
          ...(this._name ? ["--name", this._name] : []),
          "--force-exit",
        ],
        {
          // Piped (not 'inherit') so we can watch stdout/stderr for the
          // scenarios-summary marker. Output is still streamed live to
          // the parent below — no log capture, just a tee with a regex test.
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PATH: `./node_modules/.bin/:${process.env.PATH}`,
            APPIUM_OPTIONS: JSON.stringify(this._appiumOptions),
          },
        }
      );

      let sawSummary = false;
      const watch = (source, sink) => {
        source.on('data', (chunk) => {
          sink.write(chunk);
          if (!sawSummary && SCENARIOS_SUMMARY.test(chunk.toString())) {
            sawSummary = true;
          }
        });
      };
      watch(child.stdout, process.stdout);
      watch(child.stderr, process.stderr);

      child.on("exit", (exitCode) => {
        if (exitCode !== 0 && !sawSummary) {
          // Non-zero exit before any scenario completed — infrastructure
          // problem, not a test failure. Surface as EX_TEMPFAIL so the
          // CI shell can retry exactly this kind of failure.
          resolve(EX_TEMPFAIL);
          return;
        }
        resolve(exitCode);
      });
    });

    this._stopServer();
    return code;
  }
}

export default CucumberLauncher;
