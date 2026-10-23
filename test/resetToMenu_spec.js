require("mocha");
const { expect } = require("chai");
const resetToMenu = require("../features/support/reset-to-menu");

// Fakes the three IO seams around a reset. `menuMissingUntilRelaunch` is the
// real failure this guards: a stalled out-of-process sheet the deeplink cannot
// dismiss, which also hides the app from WDA, so the menu never arrives however
// long the poll waits — and only relaunching the app takes the sheet down.
function fakeApp({ menuMissingUntilRelaunch = false, menuNeverArrives = false } = {}) {
	let relaunches = 0;
	let softResets = 0;
	return {
		relaunches: () => relaunches,
		softResets: () => softResets,
		softReset: async () => { softResets++; },
		relaunch: async () => { relaunches++; },
		waitForMenu: async () => {
			if (menuNeverArrives) throw new Error("app did not return to the logged-out menu after reset");
			if (menuMissingUntilRelaunch && relaunches === 0) {
				throw new Error("app did not return to the logged-out menu after reset");
			}
		},
	};
}

describe("resetToMenu", function () {
	it("relaunches the app when the reset never reaches the menu, and carries on", async function () {
		const app = fakeApp({ menuMissingUntilRelaunch: true });
		await resetToMenu(app);
		expect(app.relaunches(), "relaunched once").to.equal(1);
	});

	it("leaves the app alone when the reset reaches the menu on its own", async function () {
		const app = fakeApp();
		await resetToMenu(app);
		expect(app.relaunches(), "no relaunch").to.equal(0);
	});

	it("gives up when the menu is still missing after the relaunch", async function () {
		const app = fakeApp({ menuNeverArrives: true });
		let thrown;
		try { await resetToMenu(app); } catch (e) { thrown = e; }
		expect(thrown, "a genuinely stuck reset still fails").to.be.an("error");
	});
});
