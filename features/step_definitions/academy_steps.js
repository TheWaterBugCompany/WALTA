const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { outlineShareOf, OUTLINE_DRAWN } = require('../support/outline-share');

When('I open the Academy from the menu', async function () {
  await this.menu.selectAcademy();
});

Then('the menu is shown', async function () {
  await this.menu.waitFor();
});

// The belt is drawn as two coloured views, so its accessibility label is what
// names it — to a screen reader and here. The name is derived from the belt's
// own two colours, so finding it is what pins the belt being the one earned.
//
// Being in the tree is not enough to know it is on screen, though: the belt is
// rotated 45 degrees, so its frame runs off the top of the window and WDA
// reports it invisible (as it does the training verdict overlays). Poll for its
// existence, then let the pixels say whether its outline was really drawn there.
Then('I am wearing a {string}', async function (name) {
  const belt = await this.menu.waitForExisting(name);
  const share = await outlineShareOf(this.driver, belt);
  expect(share, `outline share of the ${name}`).to.be.greaterThan(OUTLINE_DRAWN);
});

When('I open my account from the menu', async function () {
  await this.menu.selectAccount();
  await this.account.waitFor();
});

Then('my belts earned include a {string}', async function (name) {
  const share = await this.account.waitForBelt(name);
  expect(share, `outline share of the ${name}`).to.be.greaterThan(OUTLINE_DRAWN);
});
