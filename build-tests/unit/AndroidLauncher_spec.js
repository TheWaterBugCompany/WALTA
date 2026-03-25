require("mocha");
const sinon = require("sinon");
const { expect } = require("chai");

const AndroidLauncher = require("../../build-utils/AndroidLauncher");

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
    it("runs adb devices and resolves when a device is found", function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      return launcher.connect().then(() => {
        expect(fakeExecFile.calledOnce).to.be.true;
        expect(fakeExecFile.firstCall.args[1]).to.deep.equal(["devices"]);
      });
    });

    it("rejects when no device is connected", function() {
      const fakeExecFile = makeExecFile({ "devices": NO_DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      return launcher.connect().then(
        () => { throw new Error("should have rejected"); },
        (err) => { expect(err.message).to.match(/No Android device/); }
      );
    });

    it("reuses the connection on subsequent calls", function() {
      const fakeExecFile = makeExecFile({ "devices": DEVICES_OUTPUT });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      return launcher.connect()
        .then(() => launcher.connect())
        .then(() => {
          expect(fakeExecFile.calledOnce).to.be.true;
        });
    });
  });

  describe("launch()", function() {
    it("starts the app using am start with intent when no activity given", function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      return launcher.launch("net.thewaterbug.waterbug").then(() => {
        const launchCall = fakeExecFile.secondCall;
        expect(launchCall.args[1]).to.deep.equal([
          "shell", "am", "start",
          "-a", "android.intent.action.MAIN",
          "-c", "android.intent.category.LAUNCHER",
          "-p", "net.thewaterbug.waterbug"
        ]);
      });
    });

    it("starts the app using am start -n when an activity is given", function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "shell am start -n net.thewaterbug.waterbug/.WaterbugActivity": ""
      });
      const launcher = new AndroidLauncher({ activity: ".WaterbugActivity", execFile: fakeExecFile });
      return launcher.launch("net.thewaterbug.waterbug").then(() => {
        const launchCall = fakeExecFile.secondCall;
        expect(launchCall.args[1]).to.deep.equal([
          "shell", "am", "start", "-n", "net.thewaterbug.waterbug/.WaterbugActivity"
        ]);
      });
    });

    it("uninstalls then installs the APK before starting when an apkPath is given", function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "uninstall net.thewaterbug.waterbug": "",
        "install -r ./builds/unit-test/Waterbug.apk": "",
        "shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      return launcher.launch("net.thewaterbug.waterbug", "./builds/unit-test/Waterbug.apk").then(() => {
        const uninstallCall = fakeExecFile.secondCall;
        const installCall = fakeExecFile.thirdCall;
        const launchCall = fakeExecFile.getCall(3);
        expect(uninstallCall.args[1]).to.deep.equal(["uninstall", "net.thewaterbug.waterbug"]);
        expect(installCall.args[1]).to.deep.equal(["install", "-r", "./builds/unit-test/Waterbug.apk"]);
        expect(launchCall.args[1]).to.deep.equal([
          "shell", "am", "start",
          "-a", "android.intent.action.MAIN",
          "-c", "android.intent.category.LAUNCHER",
          "-p", "net.thewaterbug.waterbug"
        ]);
      });
    });

    it("proceeds with install even if uninstall fails (app not previously installed)", function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "uninstall net.thewaterbug.waterbug": new Error("adb: failed to uninstall"),
        "install -r ./builds/unit-test/Waterbug.apk": "",
        "shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      return launcher.launch("net.thewaterbug.waterbug", "./builds/unit-test/Waterbug.apk");
    });
  });

  describe("terminate()", function() {
    it("force-stops the app using am force-stop with the given appId", function() {
      const fakeExecFile = makeExecFile({
        "devices": DEVICES_OUTPUT,
        "shell am force-stop net.thewaterbug.waterbug": ""
      });
      const launcher = new AndroidLauncher({ execFile: fakeExecFile });
      return launcher.terminate("net.thewaterbug.waterbug").then(() => {
        const stopCall = fakeExecFile.secondCall;
        expect(stopCall.args[1]).to.deep.equal([
          "shell", "am", "force-stop", "net.thewaterbug.waterbug"
        ]);
      });
    });
  });
});
