import { expect } from "chai";
import sinon from "sinon";
import { EventEmitter } from "events";

import LiveViewLauncher from "../../build-utils/LiveViewLauncher.js";

function makeSpawn(readyMessage) {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const proc = Object.assign(new EventEmitter(), { stdout, stderr, kill: sinon.stub(), unref: sinon.stub(), pid: 1234 });
  const stub = sinon.stub().callsFake(() => {
    if (readyMessage) {
      process.nextTick(() => stdout.emit("data", readyMessage + "\n"));
    }
    return proc;
  });
  return { stub, proc };
}

function makeExecFile(responses) {
  return sinon.stub().callsFake((cmd, args, callback) => {
    const key = `${cmd} ${args.join(" ")}`;
    const response = responses[key];
    if (response instanceof Error) {
      callback(response, "", response.message);
    } else {
      callback(null, response || "", "");
    }
  });
}

describe("LiveViewLauncher", function () {

  describe("isRunning()", function () {
    it("should return true when server is listening on the port", async function () {
      const execFile = makeExecFile({ "lsof -ti :8323": "1234\n" });
      const launcher = new LiveViewLauncher({ execFile });
      expect(await launcher.isRunning()).to.be.true;
    });

    it("should return false when nothing is listening", async function () {
      const execFile = makeExecFile({ "lsof -ti :8323": new Error("no process") });
      const launcher = new LiveViewLauncher({ execFile });
      expect(await launcher.isRunning()).to.be.false;
    });
  });

  describe("start()", function () {
    it("should spawn ti serve as a detached process", async function () {
      const { stub, proc } = makeSpawn("[LiveView] Server ready");
      const launcher = new LiveViewLauncher({
        spawn: stub,
        command: "./node_modules/.bin/titanium",
        args: ["serve", "-p", "android"]
      });

      await launcher.start();

      expect(stub.calledOnce).to.be.true;
      expect(stub.firstCall.args[0]).to.equal("./node_modules/.bin/titanium");
      expect(stub.firstCall.args[1]).to.deep.equal(["serve", "-p", "android"]);
      expect(stub.firstCall.args[2]).to.deep.include({ detached: true, stdio: ["ignore", "pipe", "pipe"] });
    });

    it("should unref the child process so grunt can exit", async function () {
      const { stub, proc } = makeSpawn("[LiveView] Server ready");
      const launcher = new LiveViewLauncher({ spawn: stub, args: [] });

      await launcher.start();

      expect(proc.unref.calledOnce).to.be.true;
    });

    it("should resolve when the ready pattern is seen in stdout", async function () {
      const { stub, proc } = makeSpawn();
      const launcher = new LiveViewLauncher({ spawn: stub, args: [] });

      const startPromise = launcher.start();
      // Emit ready after a tick
      process.nextTick(() => proc.stdout.emit("data", "some noise\n[LiveView] Server ready\n"));

      await startPromise; // should resolve without timeout
    });

    it("should reject if the process exits before becoming ready", async function () {
      const { stub, proc } = makeSpawn();
      const launcher = new LiveViewLauncher({ spawn: stub, args: [] });

      const startPromise = launcher.start();
      process.nextTick(() => proc.emit("close", 1));

      try {
        await startPromise;
        expect.fail("should have rejected");
      } catch (err) {
        expect(err.message).to.include("exited");
      }
    });
  });

  describe("stop()", function () {
    it("should kill the process on the liveview port", async function () {
      const execFile = makeExecFile({
        "lsof -ti :8323": "1234\n",
        "kill -9 1234": ""
      });
      const launcher = new LiveViewLauncher({ execFile });

      await launcher.stop();

      expect(execFile.calledTwice).to.be.true;
      expect(execFile.firstCall.args[0]).to.equal("lsof");
      expect(execFile.secondCall.args[0]).to.equal("kill");
      expect(execFile.secondCall.args[1]).to.deep.equal(["-9", "1234"]);
    });

    it("should not fail if nothing is listening", async function () {
      const execFile = makeExecFile({
        "lsof -ti :8323": new Error("no process")
      });
      const launcher = new LiveViewLauncher({ execFile });

      await launcher.stop(); // should not throw
    });
  });

  describe("ensureRunning()", function () {
    it("should return true (reused) when server is already running", async function () {
      const execFile = makeExecFile({ "lsof -ti :8323": "1234\n" });
      const { stub } = makeSpawn();
      const launcher = new LiveViewLauncher({ execFile, spawn: stub, args: [] });

      const reused = await launcher.ensureRunning();

      expect(reused).to.be.true;
      expect(stub.called).to.be.false;
    });

    it("should start server and return false (fresh) when not running", async function () {
      const execFile = makeExecFile({ "lsof -ti :8323": new Error("no process") });
      const { stub } = makeSpawn("[LiveView] Server ready");
      const launcher = new LiveViewLauncher({ execFile, spawn: stub, args: [] });

      const reused = await launcher.ensureRunning();

      expect(reused).to.be.false;
      expect(stub.calledOnce).to.be.true;
    });
  });
});
