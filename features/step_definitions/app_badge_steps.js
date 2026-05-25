'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
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
// notification-dot driven by an ongoing "Sync recommended" notification on the
// `sync-recommended` channel (WB-10b). We read posted notifications from
// `dumpsys notification` rather than the shade UI, which renders inconsistently
// across Android versions. An active NotificationRecord on our channel means
// the dot is showing; it disappears from the list once the notification is
// cancelled. The channel *registry* uses a different format (mId='...') so a
// `channel=sync-recommended` NotificationRecord line is unambiguously a post.
function adbBin() {
    return process.env.ANDROID_SDK_ROOT
        ? path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
        : 'adb';
}

function syncNotificationPosted() {
    const dev = process.env.ANDROID_SERIAL ? ['-s', process.env.ANDROID_SERIAL] : [];
    const dump = execFileSync(adbBin(), [...dev, 'shell', 'dumpsys', 'notification']).toString();
    return dump
        .split('\n')
        .some((line) => line.includes('NotificationRecord')
            && line.includes('pkg=' + APP_ID)
            && line.includes('channel=sync-recommended'));
}

// Poll until the posted/cleared state settles — the notification is posted a
// beat after the Topics event that triggers it.
async function waitForSyncNotification(driver, shouldBePresent) {
    let posted = false;
    await driver
        .waitUntil(async () => {
            posted = syncNotificationPosted();
            return posted === shouldBePresent;
        }, { timeout: 10000, interval: 500 })
        .catch(() => {});
    return posted;
}

Then('the app shows a sync notification', { timeout: 30000 }, async function () {
    const posted = await waitForSyncNotification(this.driver, true);
    if (!posted) {
        throw new Error('Expected a sync notification but none was posted');
    }
});

Then('the app shows no sync notification', { timeout: 30000 }, async function () {
    const posted = await waitForSyncNotification(this.driver, false);
    if (posted) {
        throw new Error('Expected no sync notification but one was posted');
    }
});
