'use strict';

const { After, BeforeAll, Status } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ARTIFACTS_ROOT = '/tmp/acceptance-artifacts';

BeforeAll(function () {
    fs.rmSync(ARTIFACTS_ROOT, { recursive: true, force: true });
    fs.mkdirSync(ARTIFACTS_ROOT, { recursive: true });
});

After({ timeout: 30000 }, async function ({ pickle, result }) {
    if (result.status !== Status.FAILED) return;

    const slug = pickle.name.replace(/[^a-zA-Z0-9-]+/g, '_').slice(0, 80);
    const dir = path.join(ARTIFACTS_ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });

    await capturePageSource(this.driver, dir);
    await captureScreenshot(this.driver, dir);
    captureDeviceLog(this.platform, dir);
    captureTempPhotos(dir);
});

// Photo-diff steps save `/tmp/<thing>_photo.png` just before
// assertLooksSame() runs; if the assertion fails, the temp file is the
// only record of what the device actually rendered. Bundling them into
// the artifact lets us recover them from CI (where /tmp is gone after
// the runner shuts down) — useful for regenerating baselines when a
// new device profile lands or the test catches a real divergence.
function captureTempPhotos(dir) {
    try {
        for (const name of fs.readdirSync('/tmp')) {
            if (/_photo\.png$/.test(name)) {
                fs.copyFileSync(path.join('/tmp', name), path.join(dir, name));
            }
        }
    } catch (e) {
        fs.writeFileSync(path.join(dir, 'temp-photos.error.txt'),
            `captureTempPhotos threw: ${e && e.message}`);
    }
}

async function capturePageSource(driver, dir) {
    try {
        const source = await driver.getPageSource();
        fs.writeFileSync(path.join(dir, 'page-source.xml'), source);
    } catch (e) {
        fs.writeFileSync(path.join(dir, 'page-source.error.txt'), `getPageSource() threw: ${e && e.message}`);
    }
}

async function captureScreenshot(driver, dir) {
    try {
        const png = await driver.takeScreenshot();
        fs.writeFileSync(path.join(dir, 'screenshot.png'), png, 'base64');
    } catch (e) {
        fs.writeFileSync(path.join(dir, 'screenshot.error.txt'), `takeScreenshot() threw: ${e && e.message}`);
    }
}

// `simctl log show --last 5m` on iOS easily produces tens of MB of
// syslog. Default spawnSync maxBuffer (1 MB) overflows with ENOBUFS,
// so bump it generously here.
const SPAWN_OPTS = { maxBuffer: 64 * 1024 * 1024 };

function captureDeviceLog(platform, dir) {
    try {
        if (platform === 'android') {
            const adb = process.env.ANDROID_SDK_ROOT
                ? path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
                : 'adb';
            const out = execFileSync(adb, ['logcat', '-d', '-t', '500', '-s', 'TiAPI:V'], SPAWN_OPTS);
            fs.writeFileSync(path.join(dir, 'device.log'), out);
        } else if (platform === 'ios' && process.env.SIM_UDID) {
            const out = execFileSync('xcrun', [
                'simctl', 'spawn', process.env.SIM_UDID,
                'log', 'show', '--last', '5m', '--style', 'syslog',
            ], SPAWN_OPTS);
            const filtered = out.toString()
                .split('\n')
                .filter((l) => /waterbug|titanium|TiAPI|TiLog|appium/i.test(l))
                .slice(-500)
                .join('\n');
            fs.writeFileSync(path.join(dir, 'device.log'), filtered);
        }
    } catch (e) {
        fs.writeFileSync(path.join(dir, 'device.log.error.txt'), `device-log capture threw: ${e && e.message}`);
    }
}
