const { Given, When, Then } = require('@cucumber/cucumber');
const path = require('path');
const { execFileSync } = require('child_process');

const SEED_IMAGE = path.resolve(process.cwd(), 'walta-app/app/spec/resources/site-mock.jpg');

function adb() {
    const tool = process.env.ANDROID_SDK_ROOT
        ? path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
        : 'adb';
    const dev = process.env.ANDROID_SERIAL ? ['-s', process.env.ANDROID_SERIAL] : [];
    return { tool, dev };
}

Given('a photo is already in the phone gallery', function () {
    if (this.platform === 'ios') {
        // Library access is pre-granted before launch (appium-world.js) —
        // granting it to the running app would terminate it. Here we only
        // seed the photo, which is safe while the app is running.
        execFileSync('xcrun', ['simctl', 'addmedia', process.env.SIM_UDID, SEED_IMAGE]);
    } else {
        // Library read permission is pre-granted before launch (appium-world.js);
        // here we only seed the photo into the gallery.
        const { tool, dev } = adb();
        const dest = '/sdcard/Pictures/seed-gallery.jpg';
        execFileSync(tool, [...dev, 'push', SEED_IMAGE, dest]);
        execFileSync(tool, [...dev, 'shell', 'am', 'broadcast',
            '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', `file://${dest}`]);
    }
});

When('the user fills out the site details choosing a photo from the gallery', { timeout: 180000 }, async function () {
    await this.menu.selectWaterbugSurvey();
    await this.siteDetails.selectDetailed();
    await this.siteDetails.selectRiver();
    await this.siteDetails.setWaterbodyName("Test Creek");
    await this.siteDetails.setNearByFeature("Bridge");
    // Opening the gallery picker pauses GPS, so wait for the fix to land first.
    await this.siteDetails.waitForLocationLock();
    await this.siteDetails.selectSitePhotoFromGallery();
    await this.photoLibrary.selectFirstPhoto();
    await this.siteDetails.goNext();
});

When('the user identifies a taxon choosing a photo from the gallery', { timeout: 180000 }, async function () {
    await this.sample.waitFor();
    await this.sample.selectAddSample();
    await this.methodSelect.viaBrowse();
    await this.browse.chooseSpecies("Agapetus");
    await this.taxon.selectAddToSample();
    // EditTaxon persists the taxon only once a photo is attached and Save is
    // pressed — here the photo comes from the gallery rather than the camera.
    await this.editTaxon.importPhotoFromGallery();
    await this.photoLibrary.selectFirstPhoto();
    await this.editTaxon.waitFor();
    await this.editTaxon.save();
});

When('the user back-dates the survey to {string}', { timeout: 120000 }, async function (dateStr) {
    await this.sample.goNext();
    await this.notes.setSurveyDate(dateStr);
});

Then('the notes screen shows the survey date {string}', async function (dateStr) {
    // The field exposes its date via accessibilityValue, so waitForText finds
    // it (value CONTAINS) even though the field's accessibilityLabel otherwise
    // masks the child date label.
    await this.notes.waitForText(dateStr);
});

When('the user completes the survey', { timeout: 120000 }, async function () {
    await this.notes.toggleSurveyComplete();
    await this.notes.setNotes("Collected in the field, entered later");
    await this.notes.goNext();
    await this.summary.goDone();
});

Then('the sample is stored in the survey history', async function () {
    await this.menu.waitFor();
    await this.menu.selectArchive();
    await this.archive.waitFor();
    await this.archive.waitForLabel("Waterbody Name");
});
