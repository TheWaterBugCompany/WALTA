'use strict';
const { Then } = require('@cucumber/cucumber');

const APP_ID = 'net.thewaterbug.waterbug';

// The app-icon badge lives on the iOS springboard, exposed to XCUITest as the
// icon's `value` (e.g. "1 new item"); no badge → empty value.
async function readSyncBadge(driver) {
    const icon = await driver.$('~Waterbug');
    await icon.waitForExist({ timeout: 10000 });
    const value = await icon.getAttribute('value');
    const match = value && value.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

// Go to the home screen and poll the icon badge until it settles on the
// expected value (the springboard re-renders a beat after the home
// transition, and slower than that on contended CI). Returns the last value
// read so the caller can report a clear mismatch.
async function waitForSyncBadge(driver, expected) {
    await driver.execute('mobile: pressButton', { name: 'home' });
    let actual = await readSyncBadge(driver);
    await driver
        .waitUntil(async () => {
            actual = await readSyncBadge(driver);
            return actual === expected;
        }, { timeout: 10000, interval: 500 })
        .catch(() => {});
    return actual;
}

Then('the app icon shows a sync badge of {int}', { timeout: 30000 }, async function (expected) {
    const actual = await waitForSyncBadge(this.driver, expected);
    await this.driver.execute('mobile: activateApp', { bundleId: APP_ID });
    if (actual !== expected) {
        throw new Error(`Expected app-icon sync badge of ${expected} but found ${actual}`);
    }
});

Then('the app icon shows no sync badge', { timeout: 30000 }, async function () {
    const actual = await waitForSyncBadge(this.driver, 0);
    await this.driver.execute('mobile: activateApp', { bundleId: APP_ID });
    if (actual !== 0) {
        throw new Error(`Expected no app-icon sync badge but found ${actual}`);
    }
});

// Android: there's no numeric app-icon badge, so the sync nudge is a launcher
// notification-dot driven by an ongoing "Sync recommended" notification
// (WB-10b). Read it from the notification shade and poll until it settles on
// the expected presence (the notification posts a beat after the Topics event).
async function waitForSyncNotification(driver, shouldBePresent) {
    await driver.openNotifications();
    let present = false;
    await driver
        .waitUntil(async () => {
            const note = await driver.$('android=new UiSelector().textContains("Sync recommended")');
            present = await note.isExisting();
            return present === shouldBePresent;
        }, { timeout: 10000, interval: 500 })
        .catch(() => {});
    await driver.pressKeyCode(4); // BACK — close the shade
    return present;
}

Then('the app shows a sync notification', { timeout: 30000 }, async function () {
    const present = await waitForSyncNotification(this.driver, true);
    if (!present) {
        throw new Error('Expected a sync notification but none was shown');
    }
});

Then('the app shows no sync notification', { timeout: 30000 }, async function () {
    const present = await waitForSyncNotification(this.driver, false);
    if (present) {
        throw new Error('Expected no sync notification but one was shown');
    }
});
