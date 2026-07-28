import { spawn as defaultSpawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { isAppiumRunning as defaultIsAppiumRunning } from "./AppiumLauncher.js";
import { parseInfraFailures } from "../features/support/infra-failure-marker.js";

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

    let { code, sawSummary, output } = await this._runCucumber([
      ...(this._name ? ["--name", this._name] : []),
    ]);

    if (code !== 0 && !sawSummary) {
      // Non-zero exit before any scenario completed — infrastructure problem,
      // not a test failure. Surface as EX_TEMPFAIL so the CI shell can retry.
      this._stopServer();
      return EX_TEMPFAIL;
    }

    if (code !== 0) {
      // Scenarios ran and something failed. Recover only if *every* failure
      // was infra (marked by the cucumber After hook) — a genuine defect
      // alongside them must stay red and never be retried (WB-200).
      const infra = parseInfraFailures(output);
      if (infra.length > 0 && infra.length === failedCount(output)) {
        if (infra.some(f => f.reason === "environmental")) {
          // An emulator/environment flake (slow GPS fix, sample tray not
          // settled). A fresh Appium session on the same device can't cure it,
          // so escalate to EX_TEMPFAIL and let the CI shell retry on a freshly
          // booted device (WB-203).
          this._stopServer();
          return EX_TEMPFAIL;
        }
        // Only dropped sessions — cheaper to re-run those scenarios in-process
        // on a fresh session than to reboot the whole device (WB-200).
        const nameArgs = infra.flatMap(f => ["--name", `^${escapeRegExp(f.name)}$`]);
        ({ code } = await this._runCucumber(nameArgs));
      }
    }

    this._stopServer();
    return code;
  }

  _runCucumber(extraArgs) {
    return new Promise((resolve) => {
      const child = this._spawn(
        "npx",
        ["cucumber-js", "--tags", this._tags, ...extraArgs, "--force-exit"],
        {
          // Piped (not 'inherit') so we can watch for the scenarios-summary
          // marker and the After hook's infra-failure markers. Output is still
          // streamed live to the parent.
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PATH: `./node_modules/.bin/:${process.env.PATH}`,
            APPIUM_OPTIONS: JSON.stringify(this._appiumOptions),
          },
        }
      );

      let sawSummary = false;
      let output = "";
      const watch = (source, sink) => {
        source.on('data', (chunk) => {
          sink.write(chunk);
          const text = chunk.toString();
          output += text;
          if (!sawSummary && SCENARIOS_SUMMARY.test(text)) sawSummary = true;
        });
      };
      watch(child.stdout, process.stdout);
      watch(child.stderr, process.stderr);

      child.on("exit", (exitCode) => resolve({ code: exitCode, sawSummary, output }));
    });
  }
}

// "9 scenarios (8 passed, 1 failed)" → 1. Zero when no "failed" is reported.
function failedCount(output) {
  const match = output.match(/\d+ scenarios? \([^)]*?(\d+) failed[^)]*\)/);
  return match ? Number(match[1]) : 0;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default CucumberLauncher;
