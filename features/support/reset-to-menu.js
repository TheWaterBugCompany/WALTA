'use strict';

// Reset the app and make sure it is actually back at the logged-out menu.
//
// The reset deeplink cannot dismiss a sheet the app never presented, and a
// native sheet hides the app from WDA's page source entirely — so when one is
// stuck the menu can never be seen, however long the poll waits. Relaunching
// takes the sheet down along with the app that showed it. Without this
// escalation one stalled sheet fails every later scenario in the run.
async function resetToMenu({ softReset, waitForMenu, relaunch }) {
	await softReset();
	try {
		await waitForMenu();
	} catch (e) {
		await relaunch();
		await waitForMenu();
	}
}

module.exports = resetToMenu;
