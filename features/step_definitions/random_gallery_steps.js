const { Given, When, Then } = require('cucumber');
When('I select the random gallery', async function () {
    await this.menu.selectGallery();
  });

Then('A photo gallery with a random selection of {int} images is opened', async function (int) {
    await this.gallery.waitFor();
    await this.swipeLeft(this);
    await this.swipeLeft(this);
    await this.swipeRight(this);
    await this.swipeRight(this)
});

When('the photo gallery is closed', async function () {
  await this.gallery.close();
});

Then('the menu screen appears', async function () {
  await this.menu.waitFor();
});