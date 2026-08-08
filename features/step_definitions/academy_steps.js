const { When, Then } = require('@cucumber/cucumber');

When('I open the Academy from the menu', async function () {
  await this.menu.selectAcademy();
});

Then('the menu is shown', async function () {
  await this.menu.waitFor();
});
