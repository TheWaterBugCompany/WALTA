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

Then('I can start the training session', async function () {
  await this.academy.waitForStartAvailable();
  // Start is an inert seam for now — extend here (and this step's wording) when
  // the training-session flow it launches is built.
  await this.academy.start();
});

When('I close the Academy', async function () {
  await this.academy.close();
});

Then('the menu is shown', async function () {
  await this.menu.waitFor();
});
