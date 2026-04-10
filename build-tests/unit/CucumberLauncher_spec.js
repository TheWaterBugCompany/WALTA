import sinon from "sinon";
import { expect } from "chai";
import { EventEmitter } from "events";
import CucumberLauncher from "../../build-utils/CucumberLauncher.js";

function makeFakeChild() {
  const child = new EventEmitter();
  return child;
}

describe("CucumberLauncher", function() {
  let fakeSpawn;
  let fakeChild;

  beforeEach(function() {
    fakeChild = makeFakeChild();
    fakeSpawn = sinon.stub().returns(fakeChild);
  });

  describe("run()", function() {
    it("spawns cucumber-js via npx with the given tags", function() {
      const launcher = new CucumberLauncher({ tags: "@smoke", spawn: fakeSpawn });
      launcher.run();
      expect(fakeSpawn.calledOnce).to.be.true;
      const [cmd, args] = fakeSpawn.firstCall.args;
      expect(cmd).to.equal("npx");
      expect(args).to.deep.equal(["cucumber-js", "--tags", "@smoke"]);
    });

    it("defaults tags to @only when none are provided", function() {
      const launcher = new CucumberLauncher({ spawn: fakeSpawn });
      launcher.run();
      const args = fakeSpawn.firstCall.args[1];
      expect(args).to.deep.equal(["cucumber-js", "--tags", "@only"]);
    });

    it("inherits stdio so cucumber output streams to the terminal", function() {
      const launcher = new CucumberLauncher({ spawn: fakeSpawn });
      launcher.run();
      const opts = fakeSpawn.firstCall.args[2];
      expect(opts.stdio).to.equal("inherit");
    });

    it("serializes appiumOptions as APPIUM_OPTIONS env var", function() {
      const launcher = new CucumberLauncher({
        spawn: fakeSpawn,
        appiumOptions: { platform: "ios", isSimulator: true, host: "local" },
      });
      launcher.run();
      const opts = fakeSpawn.firstCall.args[2];
      const parsed = JSON.parse(opts.env.APPIUM_OPTIONS);
      expect(parsed.platform).to.equal("ios");
      expect(parsed.isSimulator).to.be.true;
      expect(parsed.host).to.equal("local");
    });

    it("prepends node_modules/.bin to PATH", function() {
      const launcher = new CucumberLauncher({ spawn: fakeSpawn });
      launcher.run();
      const opts = fakeSpawn.firstCall.args[2];
      expect(opts.env.PATH).to.match(/^\.\/node_modules\/.bin\//);
    });

    it("resolves with exit code 0 when cucumber-js exits successfully", async function() {
      const launcher = new CucumberLauncher({ spawn: fakeSpawn });
      const result = launcher.run();
      fakeChild.emit("exit", 0);
      expect(await result).to.equal(0);
    });

    it("resolves with the non-zero exit code when cucumber-js fails", async function() {
      const launcher = new CucumberLauncher({ spawn: fakeSpawn });
      const result = launcher.run();
      fakeChild.emit("exit", 1);
      expect(await result).to.equal(1);
    });
  });
});
