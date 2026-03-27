import sinon from "sinon";
import { expect } from "chai";
import IosSimulatorLauncher from "../../build-utils/IosSimulatorLauncher.js";

const UDID = "8A665EBC-2A48-4965-A1B6-E52A289C9744";

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

describe("IosSimulatorLauncher", function() {
  describe("connect()", function() {
    it("boots the simulator via xcrun simctl boot", async function() {
      const fakeExecFile = makeExecFile({ [`simctl boot ${UDID}`]: "" });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.connect();
      const call = fakeExecFile.firstCall;
      expect(call.args[0]).to.equal("xcrun");
      expect(call.args[1]).to.deep.equal(["simctl", "boot", UDID]);
    });

    it("tolerates 'already booted' error from simctl boot", async function() {
      const err = new Error("Unable to boot device in current state: Booted");
      const fakeExecFile = makeExecFile({ [`simctl boot ${UDID}`]: err });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.connect(); // should not throw
    });

    it("is idempotent — only boots once on repeated connect() calls", async function() {
      const fakeExecFile = makeExecFile({ [`simctl boot ${UDID}`]: "" });
      const launcher = new IosSimulatorLauncher({ execFile: fakeExecFile, udid: UDID });
      await launcher.connect();
      await launcher.connect();
      expect(fakeExecFile.callCount).to.equal(1);
    });

    it("throws immediately when udid is not provided", async function() {
      const launcher = new IosSimulatorLauncher({});
      try {
        await launcher.connect();
        throw new Error("should have thrown");
      } catch (err) {
        expect(err.message).to.match(/requires a udid/);
      }
    });
  });
});
