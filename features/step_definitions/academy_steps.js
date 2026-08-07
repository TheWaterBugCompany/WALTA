const { When, Then } = require('@cucumber/cucumber');

When('I open the Academy from the menu', async function () {
  await this.menu.selectAcademy();
});

Then('the Academy training screen appears', async function () {
  await this.academy.waitFor();
});

When('I enter the session code {string}', async function (code) {
  await this.academy.enterCode(code);
});

Then('the training session can be started', async function () {
  // A valid code enables (greens) Start; the capstone scenario drives the actual
  // launch via "I start the training session".
  await this.academy.waitForStartAvailable();
});

When('I close the Academy', async function () {
  await this.academy.close();
});

Then('the menu is shown', async function () {
  await this.menu.waitFor();
});
