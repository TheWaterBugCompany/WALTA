const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { OUTLINE_DRAWN } = require('../support/outline-share');

When('I open my account from the menu', async function () {
  await this.menu.selectAccount();
  await this.account.waitFor();
});

// A belt is drawn as two coloured views, so its accessibility label is what
// names it. Being in the tree is not enough to know it was drawn, though — the
// outline says whether it was really painted there.
Then('my belts earned include a {string}', async function (name) {
  const share = await this.account.waitForBelt(name);
  expect(share, `outline share of the ${name}`).to.be.greaterThan(OUTLINE_DRAWN);
});

When('I choose to delete my account', async function () {
  await this.account.chooseDeleteAccount();
  await this.deleteAccount.waitFor();
});

Then('I am warned that deleting my account cannot be undone', async function () {
  await this.deleteAccount.waitForText('unrecoverable');
});

Then('my account details are shown, untouched', async function () {
  await this.account.waitFor();
});

When('I delete my account with my password', async function () {
  await this.deleteAccount.enterPassword('password');
  await this.deleteAccount.confirmDelete();
});

When('I close the delete account dialogue', async function () {
  await this.deleteAccount.close();
});

Then('I am logged out', async function () {
  await this.menu.waitFor();
  await this.menu.waitForLabel("Log In");
});
