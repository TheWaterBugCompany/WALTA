'use strict';

const { After, BeforeAll, Status } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

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
    captureMockCerdiLog(dir);
});

// The mock cerdi server (features/support/mock-cerdi-server.js) appends
// every request/response to /tmp/mock-cerdi.log for the whole session.
// When a login or sync step fails, this log tells us whether the HTTP
// call ever reached the mock at all — distinguishing "deeplink/URL
// handler never fired" from "login hit the server but the app didn't
// observe LOGGEDIN".
function captureMockCerdiLog(dir) {
    const logPath = process.env.MOCK_CERDI_LOG === '0'
        ? null
        : (process.env.MOCK_CERDI_LOG || '/tmp/mock-cerdi.log');
    if (!logPath) return;
    try {
        if (fs.existsSync(logPath)) {
            fs.copyFileSync(logPath, path.join(dir, 'mock-cerdi.log'));
        }
    } catch (e) {
        fs.writeFileSync(path.join(dir, 'mock-cerdi.log.error.txt'),
            `captureMockCerdiLog threw: ${e && e.message}`);
    }
}

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
            // Even with maxBuffer at 64MB, `simctl spawn ... log show` was
            // failing with ENOBUFS — the kernel pipe between xcrun and Node
            // gets backed up on a near-OOM CI runner mid-acceptance-run.
            // Redirecting xcrun's stdout directly to a file via the shell
            // sidesteps Node's pipe entirely, so we can take a generous
            // window. 5m covers the full 120s step timeout + setup.
            const rawPath = path.join(dir, 'device.log.raw');
            const r = spawnSync('sh', ['-c',
                `xcrun simctl spawn ${process.env.SIM_UDID} log show --last 5m --style syslog > '${rawPath}'`,
            ], { stdio: ['ignore', 'inherit', 'inherit'] });
            if (r.status !== 0) {
                throw new Error(`xcrun exited ${r.status}${r.error ? ': ' + r.error.message : ''}`);
            }
            // Two filters: (a) drop XCTAutomationSupport AX-scan spam that
            // mentions "Waterbug" only as the AX target, (b) keep lines
            // from the app's own process — `Waterbug[<pid>]:` — plus any
            // line explicitly tagged TiAPI / TiLog / WB89.
            const filtered = fs.readFileSync(rawPath, 'utf8')
                .split('\n')
                .filter((l) => /(Waterbug\[\d+\]:|TiAPI|TiLog|WB89)/.test(l))
                .filter((l) => !/XCTAutomationSupport/.test(l))
                .slice(-2000)
                .join('\n');
            fs.writeFileSync(path.join(dir, 'device.log'), filtered);
            // Keep the raw log too. The filter above is heuristic — if Ti.API
            // output uses an unexpected process name (or the window mostly
            // contained XCT scans), the filtered file will be empty. The raw
            // file lets us see what was actually emitted. Capped at 2MB; the
            // unfiltered 5-minute log can run to ~10 MB which is too much
            // artifact bloat to upload routinely.
            const rawStat = fs.statSync(rawPath);
            const RAW_CAP = 2 * 1024 * 1024;
            if (rawStat.size > RAW_CAP) {
                const fd = fs.openSync(rawPath, 'r');
                const buf = Buffer.alloc(RAW_CAP);
                fs.readSync(fd, buf, 0, RAW_CAP, rawStat.size - RAW_CAP);
                fs.closeSync(fd);
                fs.writeFileSync(path.join(dir, 'device.log.raw'), buf);
                fs.unlinkSync(rawPath);
            } else {
                fs.renameSync(rawPath, path.join(dir, 'device.log.raw'));
            }
        }
    } catch (e) {
        fs.writeFileSync(path.join(dir, 'device.log.error.txt'), `device-log capture threw: ${e && e.message}`);
    }
}
