import { spawn as defaultSpawn } from "child_process";
import { isAppiumRunning as defaultIsAppiumRunning } from "./AppiumLauncher.js";

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
  } = {}) {
    this._tags = tags;
    this._name = name;
    this._appiumOptions = appiumOptions;
    this._spawn = spawn;
    this._isAppiumRunning = isAppiumRunning;
    this._killProcess = killProcess || ((pid) => {
      try { process.kill(-pid, 'SIGTERM'); } catch (e) { /* already gone */ }
    });
    this._serverPid = null;
  }

  async _ensureServer() {
    if (await this._isAppiumRunning()) return;
    const child = this._spawn('npx', ['appium'], {
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
    this._serverPid = child.pid;

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await this._isAppiumRunning()) return;
    }
    throw new Error('Appium server failed to start within 30s');
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
