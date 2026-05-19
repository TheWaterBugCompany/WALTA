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
      expect(fakeSpawn.firstCall.args[1]).to.include("appium");
      expect(fakeSpawn.secondCall.args[1]).to.include("cucumber-js");
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
