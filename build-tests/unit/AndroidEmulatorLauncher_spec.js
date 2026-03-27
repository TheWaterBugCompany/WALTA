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

describe("AndroidEmulatorLauncher", function() {
  describe("connect()", function() {
    it("does not start the emulator when one is already running", async function() {
      const fakeExecFile = makeExecFile({ "devices": EMULATOR_DEVICES });
      const fakeLauncher = { connect: sinon.stub().resolves() };
      const launcher = new AndroidEmulatorLauncher({ execFile: fakeExecFile, innerLauncher: fakeLauncher });
      await launcher.connect();
      expect(fakeLauncher.connect.calledOnce).to.be.true;
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
});
