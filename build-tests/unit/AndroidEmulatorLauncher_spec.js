import sinon from "sinon";
import { expect } from "chai";
import AndroidEmulatorLauncher from "../../build-utils/AndroidEmulatorLauncher.js";

function makeExecFile(responses) {
  return sinon.stub().callsFake((_cmd, args, callback) => {
    const key = args.join(" ");
    const response = responses[key] ??
      Object.entries(responses).find(([k]) => key.startsWith(k))?.[1];
    if (response instanceof Error) {
      callback(response, "", response.message);
    } else {
      callback(null, response || "", "");
    }
  });
}

const EMULATOR_DEVICES = "List of devices attached\nemulator-5554\tdevice\n";
const NO_DEVICES = "List of devices attached\n";
const AVD_NAME = "Test_AVD";

function makeSpawn() {
  const proc = { kill: sinon.stub() };
  return { stub: sinon.stub().returns(proc), proc };
}

describe("AndroidEmulatorLauncher", function() {
  describe("connect()", function() {
    it("does not start the emulator when one is already running", async function() {
      const fakeExecFile = makeExecFile({ "devices": EMULATOR_DEVICES });
      const fakeLauncher = { connect: sinon.stub().resolves() };
      const launcher = new AndroidEmulatorLauncher({ execFile: fakeExecFile, innerLauncher: fakeLauncher });
      await launcher.connect();
      expect(fakeLauncher.connect.calledOnce).to.be.true;
    });

    it("spawns emulator and waits for boot when no emulator is running", async function() {
      const fakeExecFile = makeExecFile({
        "devices": NO_DEVICES,
        "wait-for-device": "",
        "shell getprop sys.boot_completed": "1",
      });
      const { stub: fakeSpawn } = makeSpawn();
      const fakeLauncher = { connect: sinon.stub().resolves() };
      const launcher = new AndroidEmulatorLauncher({
        avdName: AVD_NAME,
        execFile: fakeExecFile,
        spawn: fakeSpawn,
        bootPollIntervalMs: 0,
        innerLauncher: fakeLauncher
      });
      await launcher.connect();
      expect(fakeSpawn.calledOnce).to.be.true;
      expect(fakeSpawn.firstCall.args[1]).to.deep.equal(["-avd", AVD_NAME, "-no-boot-anim", "-no-audio"]);
      expect(fakeLauncher.connect.calledOnce).to.be.true;
    });

    it("rejects with a clear error if the emulator does not finish booting within the timeout", async function() {
      const fakeExecFile = makeExecFile({
        "devices": NO_DEVICES,
        "wait-for-device": "",
        "shell getprop sys.boot_completed": "0",
      });
      const { stub: fakeSpawn } = makeSpawn();
      const fakeLauncher = { connect: sinon.stub().resolves() };
      const launcher = new AndroidEmulatorLauncher({
        execFile: fakeExecFile,
        spawn: fakeSpawn,
        bootTimeoutMs: 10,
        bootPollIntervalMs: 0,
        innerLauncher: fakeLauncher
      });
      try {
        await launcher.connect();
        throw new Error("should have rejected");
      } catch (err) {
        expect(err.message).to.match(/did not finish booting/);
      }
    });

    it("does not call innerLauncher.connect() more than once on repeated calls", async function() {
      const fakeExecFile = makeExecFile({ "devices": EMULATOR_DEVICES });
      const fakeLauncher = { connect: sinon.stub().resolves() };
      const launcher = new AndroidEmulatorLauncher({ execFile: fakeExecFile, innerLauncher: fakeLauncher });
      await launcher.connect();
      await launcher.connect();
      expect(fakeExecFile.callCount).to.equal(1);
    });
  });

  describe("launch(), terminate(), streamLogs(), getDriver()", function() {
    let launcher, fakeLauncher;

    beforeEach(async function() {
      const fakeExecFile = makeExecFile({ "devices": EMULATOR_DEVICES });
      fakeLauncher = {
        connect: sinon.stub().resolves(),
        launch: sinon.stub().resolves(),
        terminate: sinon.stub().resolves(),
        streamLogs: sinon.stub().returns(() => {}),
        captureDiagnostics: sinon.stub().resolves("device state"),
      };
      launcher = new AndroidEmulatorLauncher({ execFile: fakeExecFile, innerLauncher: fakeLauncher });
      await launcher.connect();
    });

    it("delegates launch() to the inner launcher", async function() {
      await launcher.launch("com.example.app", "/path/to/app.apk");
      expect(fakeLauncher.launch.calledWith("com.example.app", "/path/to/app.apk")).to.be.true;
    });

    it("forwards launchArgs to the inner launcher when provided", async function() {
      await launcher.launch("com.example.app", null, { test_grep: "About", test_manual: true });
      expect(fakeLauncher.launch.calledWith(
        "com.example.app",
        null,
        { test_grep: "About", test_manual: true }
      )).to.be.true;
    });

    it("calls connect() before delegating launch() so the emulator serial is set", async function() {
      const freshLauncher = new AndroidEmulatorLauncher({
        execFile: makeExecFile({ "devices": EMULATOR_DEVICES }),
        innerLauncher: fakeLauncher
      });
      // connect() NOT called — launch() must trigger it
      await freshLauncher.launch("com.example.app", "/path/to/app.apk");
      expect(freshLauncher._connected).to.be.true;
      expect(fakeLauncher.launch.called).to.be.true;
    });

    it("delegates terminate() to the inner launcher", async function() {
      await launcher.terminate("com.example.app");
      expect(fakeLauncher.terminate.calledWith("com.example.app")).to.be.true;
    });

    it("delegates streamLogs() to the inner launcher", function() {
      const onLine = () => {};
      launcher.streamLogs(onLine);
      expect(fakeLauncher.streamLogs.calledWith(onLine)).to.be.true;
    });

    it("delegates captureDiagnostics() to the inner launcher", async function() {
      const report = await launcher.captureDiagnostics("com.example.app");
      expect(fakeLauncher.captureDiagnostics.calledWith("com.example.app")).to.be.true;
      expect(report).to.equal("device state");
    });

    it("getDriver() returns null", function() {
      expect(launcher.getDriver()).to.be.null;
    });
  });
});

// The emulator launcher wraps a device launcher rather than extending it, so
// every call the visual host makes has to be forwarded by hand — and a forward
// that is missing, or that drops its options, is invisible until a capture comes
// out wrong. CI drives this launcher, not AndroidLauncher, so the visual surface
// is pinned here.
describe("AndroidEmulatorLauncher visual capture", function() {
  function launcherWith(inner) {
    return new AndroidEmulatorLauncher({
      execFile: makeExecFile({ "devices": EMULATOR_DEVICES }),
      innerLauncher: { connect: sinon.stub().resolves(), ...inner },
    });
  }

  it("forwards the orientation a screenshot has to be rotated by", async function() {
    const screenshotFramebuffer = sinon.stub().resolves("/out/Menu.png");
    const launcher = launcherWith({ screenshotFramebuffer });
    await launcher.screenshotFramebuffer("/out/Menu.png", { orientation: "landscape-right" });
    expect(screenshotFramebuffer.firstCall.args)
      .to.deep.equal(["/out/Menu.png", { orientation: "landscape-right" }]);
  });

  it("names the device the captures were rendered on", async function() {
    const launcher = launcherWith({ describeDevice: sinon.stub().resolves("sdk_gphone64_arm64 · Android 14") });
    expect(await launcher.describeDevice()).to.equal("sdk_gphone64_arm64 · Android 14");
  });
});
