import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import CucumberLauncher from "../../build-utils/CucumberLauncher.js";

function makeFakeChild() {
  return Object.assign(new EventEmitter(), { unref: sinon.stub() });
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

    it("defaults tags to @only when none are provided", async function() {
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        isAppiumRunning: fakeIsRunning,
      });
      const promise = launcher.run();
      await exitAfterSpawn(fakeSpawn, 0, 0);
      await promise;
      expect(fakeSpawn.firstCall.args[1]).to.deep.equal(["cucumber-js", "--tags", "@only", "--force-exit"]);
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
      await exitAfterSpawn(fakeSpawn, 0, 1);
      expect(await promise).to.equal(1);
    });
  });
});
