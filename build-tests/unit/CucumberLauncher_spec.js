import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import CucumberLauncher from "../../build-utils/CucumberLauncher.js";

function makeFakeChild() {
  const child = Object.assign(new EventEmitter(), { unref: sinon.stub() });
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

// Trigger the lifecycle the launcher's stdout-watcher expects:
// emit some stdout chunks, then exit. Used to simulate cucumber-js
// runs that did/didn't reach the "N scenarios (...)" summary.
function emitThenExit(child, { stdoutChunks = [], stderrChunks = [], code = 0 } = {}) {
  for (const chunk of stdoutChunks) child.stdout.emit("data", Buffer.from(chunk));
  for (const chunk of stderrChunks) child.stderr.emit("data", Buffer.from(chunk));
  child.emit("exit", code);
}

// Helper: wait for the spawn stub to be called, then emit exit on the
// returned child. Needed because run() is async — _ensureServer must
// resolve before the cucumber spawn happens.
function exitAfterSpawn(spawnStub, childIndex, code) {
  return new Promise(resolve => {
    const check = () => {
      if (spawnStub.callCount > childIndex) {
        const child = spawnStub.getCall(childIndex).returnValue;
        child.emit("exit", code);
        resolve();
      } else {
        setTimeout(check, 5);
      }
    };
    check();
  });
}

describe("CucumberLauncher", function() {
  let fakeSpawn;
  let fakeChild;
  let fakeIsRunning;

  beforeEach(function() {
    fakeChild = makeFakeChild();
    fakeSpawn = sinon.stub().returns(fakeChild);
    // Default: appium already running, so _ensureServer is a no-op
    fakeIsRunning = sinon.stub().resolves(true);
  });

  describe("run()", function() {
    it("ensures appium is running before spawning cucumber", async function() {
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 0, 0);
      await promise;
      expect(fakeSpawn.calledOnce).to.be.true;
      expect(fakeSpawn.firstCall.args[1]).to.include("cucumber-js");
    });

    it("starts the appium server if it is not already running", async function() {
      fakeIsRunning.onFirstCall().resolves(false);
      fakeIsRunning.onSecondCall().resolves(true);

      const appiumChild = makeFakeChild();
      const cucumberChild = makeFakeChild();
      fakeSpawn.onFirstCall().returns(appiumChild);
      fakeSpawn.onSecondCall().returns(cucumberChild);

      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 1, 0); // wait for cucumber spawn (index 1)
      await promise;

      expect(fakeSpawn.calledTwice).to.be.true;
      expect(fakeSpawn.firstCall.args[0]).to.match(/appium$/);
      expect(fakeSpawn.secondCall.args[1]).to.include("cucumber-js");
    });

    // The appium server's log carries the WDA/xcode command trace
    // (showXcodeLog) needed to pinpoint a hung driver command. Spawn it with
    // debug file logging so failure-diagnostics can capture ./appium.log.
    it("starts the appium server with debug file logging so the WDA log is captured", async function() {
      fakeIsRunning.onFirstCall().resolves(false);
      fakeIsRunning.onSecondCall().resolves(true);

      const appiumChild = makeFakeChild();
      const cucumberChild = makeFakeChild();
      fakeSpawn.onFirstCall().returns(appiumChild);
      fakeSpawn.onSecondCall().returns(cucumberChild);

      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 1, 0);
      await promise;

      const appiumArgs = fakeSpawn.firstCall.args[1];
      expect(appiumArgs).to.include("--log");
      expect(appiumArgs).to.include("./appium.log");
      expect(appiumArgs).to.include("--log-level");
      expect(appiumArgs).to.include("info:debug");
    });

    // npx resolution adds ~8 min cold-start latency on macOS-15 runners
    // (see WB-49). Spawn the directly-resolved binary instead.
    it("spawns the direct appium binary, not npx", async function() {
      fakeIsRunning.onFirstCall().resolves(false);
      fakeIsRunning.onSecondCall().resolves(true);

      const appiumChild = makeFakeChild();
      const cucumberChild = makeFakeChild();
      fakeSpawn.onFirstCall().returns(appiumChild);
      fakeSpawn.onSecondCall().returns(cucumberChild);

      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 1, 0);
      await promise;

      const cmd = fakeSpawn.firstCall.args[0];
      expect(cmd).to.not.equal("npx");
      expect(cmd).to.match(/node_modules\/\.bin\/appium$/);
    });

    // The previous hard-coded 30s ceiling fired before macOS-15 CI runners
    // could even cold-start Appium. Mirror AppiumLauncher's configurable
    // serverStartTimeoutMs (default 300s) so the message names the real value.
    it("throws after the configured serverStartTimeoutMs with the message naming the value", async function() {
      fakeIsRunning.resolves(false);

      const appiumChild = makeFakeChild();
      fakeSpawn.returns(appiumChild);

      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
        serverStartTimeoutMs: 100,
      });

      let caught;
      try { await launcher.run(); } catch (e) { caught = e; }
      expect(caught, "expected timeout error").to.exist;
      expect(caught.message).to.match(/Appium server failed to start within 0\.1s/);
    });

    it("stops the server after cucumber exits if we started it", async function() {
      fakeIsRunning.onFirstCall().resolves(false);
      fakeIsRunning.onSecondCall().resolves(true);

      const appiumChild = Object.assign(makeFakeChild(), { pid: 99999 });
      const cucumberChild = makeFakeChild();
      fakeSpawn.onFirstCall().returns(appiumChild);
      fakeSpawn.onSecondCall().returns(cucumberChild);
      const fakeKill = sinon.stub();

      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
        killProcess: fakeKill,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 1, 0);
      await promise;

      expect(fakeKill.calledOnce).to.be.true;
      expect(fakeKill.firstCall.args[0]).to.equal(99999);
    });

    it("spawns cucumber-js with the given tags", async function() {
      const launcher = new CucumberLauncher({
        tags: "@smoke",
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 0, 0);
      await promise;

      const [cmd, args] = fakeSpawn.firstCall.args;
      expect(cmd).to.equal("npx");
      expect(args).to.deep.equal(["cucumber-js", "--tags", "@smoke", "--force-exit"]);
    });

    it("defaults tags to 'not @skip' when none are provided", async function() {
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 0, 0);
      await promise;
      expect(fakeSpawn.firstCall.args[1]).to.deep.equal(["cucumber-js", "--tags", "not @skip", "--force-exit"]);
    });

    it("passes --name <pattern> to cucumber-js when name is provided", async function() {
      const launcher = new CucumberLauncher({
        name: "Log in with existing",
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 0, 0);
      await promise;
      expect(fakeSpawn.firstCall.args[1]).to.deep.equal(
        ["cucumber-js", "--tags", "not @skip", "--name", "Log in with existing", "--force-exit"]
      );
    });

    it("serializes appiumOptions as APPIUM_OPTIONS env var", async function() {
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
        appiumOptions: { platform: "ios", isSimulator: true, host: "local" },
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 0, 0);
      await promise;

      const parsed = JSON.parse(fakeSpawn.firstCall.args[2].env.APPIUM_OPTIONS);
      expect(parsed.platform).to.equal("ios");
      expect(parsed.isSimulator).to.be.true;
      expect(parsed.host).to.equal("local");
    });

    it("resolves with exit code 0 when cucumber-js exits successfully", async function() {
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 0, 0);
      expect(await promise).to.equal(0);
    });

    it("resolves with the non-zero exit code when cucumber-js fails", async function() {
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      // Include the scenarios-summary marker so "tests-ran-and-failed" is
      // distinguished from "tests-never-started" (covered below).
      const wait = exitAfterSpawnEmit(fakeSpawn, 0, {
        stdoutChunks: ["7 scenarios (5 failed, 2 passed)\n"],
        code: 1,
      });
      await wait;
      expect(await promise).to.equal(1);
    });

    // WB-94: distinguish startup-infra failure from real test failure so
    // CI can retry the former but not the latter. Marker = the
    // "N scenarios (...)" summary cucumber-js prints once it has run at
    // least one scenario through to its end-of-run summary. If cucumber-js
    // exits non-zero *without* ever printing that summary, it never
    // reached scenarios (Appium connect refused, BeforeAll crash, etc.) —
    // a transient infrastructure problem — and we surface `75` (BSD
    // sysexits.h `EX_TEMPFAIL`) so the CI shell knows it's retry-eligible.
    it("resolves with EX_TEMPFAIL (75) when cucumber-js exits non-zero without the scenarios-summary marker", async function() {
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      const wait = exitAfterSpawnEmit(fakeSpawn, 0, {
        stderrChunks: ["Error: connect ECONNREFUSED 127.0.0.1:4723\n"],
        code: 1,
      });
      await wait;
      expect(await promise).to.equal(75);
    });

    it("propagates cucumber-js's exit code unchanged when the scenarios-summary marker is present", async function() {
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      // Cucumber-js exit 2 is config error — but if it emitted the
      // summary line, scenarios ran. Don't rewrite to EX_TEMPFAIL.
      const wait = exitAfterSpawnEmit(fakeSpawn, 0, {
        stdoutChunks: ["1 scenario (1 failed)\n"],
        code: 2,
      });
      await wait;
      expect(await promise).to.equal(2);
    });

    it("resolves with 0 (not 75) when cucumber-js succeeds even if no summary was captured", async function() {
      // Defensive: success is success; the EX_TEMPFAIL rewrite only
      // applies when the exit code was already non-zero.
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      const wait = exitAfterSpawnEmit(fakeSpawn, 0, { code: 0 });
      await wait;
      expect(await promise).to.equal(0);
    });
  });

  // WB-200: a scenario killed by an infra session-drop is marked by the
  // cucumber After hook. When every failure is infra, re-run just those
  // scenarios on a fresh session rather than failing the whole suite.
  describe("infra-failure re-run", function() {
    const INFRA_MARKER = "[infra-failure] session-dead :: ";

    it("re-runs only the infra-failed scenario by name and returns its result", async function() {
      const child0 = makeFakeChild();
      const child1 = makeFakeChild();
      fakeSpawn.onFirstCall().returns(child0);
      fakeSpawn.onSecondCall().returns(child1);
      const launcher = new CucumberLauncher({ spawn: fakeSpawn, isAppiumRunning: fakeIsRunning });

      const promise = launcher.run();
      await exitAfterSpawnEmit(fakeSpawn, 0, {
        stdoutChunks: [`${INFRA_MARKER}Sync from history\n`, "1 scenario (1 failed)\n"],
        code: 1,
      });
      await exitAfterSpawnEmit(fakeSpawn, 1, {
        stdoutChunks: ["1 scenario (1 passed)\n"],
        code: 0,
      });

      expect(await promise).to.equal(0);
      expect(fakeSpawn.calledTwice, "should have re-run cucumber once").to.be.true;
      const rerunArgs = fakeSpawn.secondCall.args[1];
      expect(rerunArgs).to.include("--name");
      expect(rerunArgs.some(a => /Sync from history/.test(a)), "re-run should target the failed scenario by name").to.be.true;
    });

    it("does not re-run, and stays red, when a genuine failure sits alongside an infra one", async function() {
      const launcher = new CucumberLauncher({ spawn: fakeSpawn, isAppiumRunning: fakeIsRunning });
      const promise = launcher.run();
      // 2 failed, but only 1 is infra-marked → the other is a real defect.
      await exitAfterSpawnEmit(fakeSpawn, 0, {
        stdoutChunks: [`${INFRA_MARKER}Flaky sync\n`, "5 scenarios (3 passed, 2 failed)\n"],
        code: 1,
      });
      expect(await promise).to.equal(1);
      expect(fakeSpawn.calledOnce, "must not re-run when a genuine failure is present").to.be.true;
    });

    it("re-runs at most once — a re-run that dies on infra again stays red", async function() {
      const child0 = makeFakeChild();
      const child1 = makeFakeChild();
      fakeSpawn.onFirstCall().returns(child0);
      fakeSpawn.onSecondCall().returns(child1);
      const launcher = new CucumberLauncher({ spawn: fakeSpawn, isAppiumRunning: fakeIsRunning });

      const promise = launcher.run();
      await exitAfterSpawnEmit(fakeSpawn, 0, {
        stdoutChunks: [`${INFRA_MARKER}Sync from history\n`, "1 scenario (1 failed)\n"],
        code: 1,
      });
      await exitAfterSpawnEmit(fakeSpawn, 1, {
        stdoutChunks: [`${INFRA_MARKER}Sync from history\n`, "1 scenario (1 failed)\n"],
        code: 1,
      });

      expect(await promise).to.equal(1);
      expect(fakeSpawn.calledTwice, "should not re-run more than once").to.be.true;
    });
  });

  // WB-203: an environmental emulator flake (slow GPS fix, sample tray not
  // settled) can't be cured by a fresh Appium session on the same device, so
  // instead of re-running in-process it escalates to EX_TEMPFAIL and lets the
  // CI shell retry on a freshly-booted device.
  describe("environmental-failure escalation (fresh-device retry)", function() {
    const ENV_MARKER = "[infra-failure] environmental :: ";
    const SESSION_MARKER = "[infra-failure] session-dead :: ";

    it("returns EX_TEMPFAIL and does NOT re-run in-process when the only failure is environmental", async function() {
      const launcher = new CucumberLauncher({ spawn: fakeSpawn, isAppiumRunning: fakeIsRunning });
      const promise = launcher.run();
      await exitAfterSpawnEmit(fakeSpawn, 0, {
        stdoutChunks: [`${ENV_MARKER}Sample collection\n`, "1 scenario (1 failed)\n"],
        code: 1,
      });
      expect(await promise).to.equal(75);
      expect(fakeSpawn.calledOnce, "a fresh session can't cure an emulator flake — must not re-run in-process").to.be.true;
    });

    it("escalates to EX_TEMPFAIL when environmental and session-dead failures mix (all infra)", async function() {
      const launcher = new CucumberLauncher({ spawn: fakeSpawn, isAppiumRunning: fakeIsRunning });
      const promise = launcher.run();
      await exitAfterSpawnEmit(fakeSpawn, 0, {
        stdoutChunks: [
          `${ENV_MARKER}Sample collection\n`,
          `${SESSION_MARKER}Sync from history\n`,
          "5 scenarios (3 passed, 2 failed)\n",
        ],
        code: 1,
      });
      expect(await promise).to.equal(75);
      expect(fakeSpawn.calledOnce).to.be.true;
    });

    it("stays red (no retry) when a genuine failure sits alongside an environmental one", async function() {
      const launcher = new CucumberLauncher({ spawn: fakeSpawn, isAppiumRunning: fakeIsRunning });
      const promise = launcher.run();
      // 2 failed, only 1 is environmental-marked → the other is a real defect.
      await exitAfterSpawnEmit(fakeSpawn, 0, {
        stdoutChunks: [`${ENV_MARKER}Sample collection\n`, "5 scenarios (3 passed, 2 failed)\n"],
        code: 1,
      });
      expect(await promise).to.equal(1);
      expect(fakeSpawn.calledOnce).to.be.true;
    });
  });
});

// Helper: wait for the spawn at childIndex, emit any stdout/stderr chunks,
// then exit with the given code. Generalises exitAfterSpawn for tests that
// need to assert behaviour against specific output content.
function exitAfterSpawnEmit(spawnStub, childIndex, opts) {
  return new Promise(resolve => {
    const check = () => {
      if (spawnStub.callCount > childIndex) {
        const child = spawnStub.getCall(childIndex).returnValue;
        emitThenExit(child, opts);
        resolve();
      } else {
        setTimeout(check, 5);
      }
    };
    check();
  });
}
