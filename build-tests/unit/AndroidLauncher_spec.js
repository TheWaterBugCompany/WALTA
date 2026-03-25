import sinon from "sinon";
import { expect } from "chai";
import AndroidLauncher from "../../build-utils/AndroidLauncher.js";

function makeExecFile(responses) {
  return sinon.stub().callsFake((cmd, args, callback) => {
    const key = args.join(" ");
    const response = responses[key];
    if (response instanceof Error) {
      callback(response, "", response.message);
    } else {
      callback(null, response || "", "");
    }
  });
}

const DEVICES_OUTPUT = "List of devices attached\nemulator-5554\tdevice\n";
const NO_DEVICES_OUTPUT = "List of devices attached\n";

describe("AndroidLauncher", function() {
  describe("connect()", function() {
    it("runs adb devices and resolves when a device is found", async function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      expect(fakeExecFile.calledOnce).to.be.true;
      expect(fakeExecFile.firstCall.args[1]).to.deep.equal(["devices"]);
    });

    it("rejects when no device is connected", async function() {
      const fakeExecFile = makeExecFile({ "devices": NO_DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      try {
        await launcher.connect();
        throw new Error("should have rejected");
      } catch(err) {
        expect(err.message).to.match(/No Android device/);
      }
    });

    it("reuses the connection on subsequent calls", async function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.connect();
      await launcher.connect();
      expect(fakeExecFile.calledOnce).to.be.true;
    });
  });

  describe("launch()", function() {
    it("starts the app using am start with intent when no activity given", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug");
      expect(fakeExecFile.secondCall.args[1]).to.deep.equal([
        "shell", "am", "start",
        "-a", "android.intent.action.MAIN",
        "-c", "android.intent.category.LAUNCHER",
        "-p", "net.thewaterbug.waterbug"
      ]);
    });

    it("starts the app using am start -n when an activity is given", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "shell am start -n net.thewaterbug.waterbug/.WaterbugActivity": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug");
      expect(fakeExecFile.secondCall.args[1]).to.deep.equal([
        "shell", "am", "start", "-n", "net.thewaterbug.waterbug/.WaterbugActivity"
      ]);
    });

    it("uninstalls then installs the APK before starting when an apkPath is given", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "uninstall net.thewaterbug.waterbug": "",
        "install -r ./builds/unit-test/Waterbug.apk": "",
        "shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", "./builds/unit-test/Waterbug.apk");
      expect(fakeExecFile.secondCall.args[1]).to.deep.equal(["uninstall", "net.thewaterbug.waterbug"]);
      expect(fakeExecFile.thirdCall.args[1]).to.deep.equal(["install", "-r", "./builds/unit-test/Waterbug.apk"]);
      expect(fakeExecFile.getCall(3).args[1]).to.deep.equal([
        "shell", "am", "start",
        "-a", "android.intent.action.MAIN",
        "-c", "android.intent.category.LAUNCHER",
        "-p", "net.thewaterbug.waterbug"
      ]);
    });

    it("proceeds with install even if uninstall fails (app not previously installed)", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "uninstall net.thewaterbug.waterbug": new Error("adb: failed to uninstall"),
        "install -r ./builds/unit-test/Waterbug.apk": "",
        "shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.launch("net.thewaterbug.waterbug", "./builds/unit-test/Waterbug.apk");
    });
  });

  describe("terminate()", function() {
    it("force-stops the app using am force-stop with the given appId", async function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "shell am force-stop net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      await launcher.terminate("net.thewaterbug.waterbug");
      expect(fakeExecFile.secondCall.args[1]).to.deep.equal([
        "shell", "am", "force-stop", "net.thewaterbug.waterbug"
      ]);
    });
  });
});
