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
    captureAppiumLog(dir);
});

// The appium server (grunt `appium` task, --log ./appium.log) carries the
// WDA/xcode output (showXcodeLog) that pins down which driver command hung —
// detail the device log can't show. The file accumulates across the whole run,
// so keep the tail to bound artifact size while still covering the failure.
function captureAppiumLog(dir) {
    const logPath = process.env.APPIUM_LOG === '0'
        ? null
        : (process.env.APPIUM_LOG || path.resolve(process.cwd(), 'appium.log'));
    if (!logPath) return;
    try {
        if (!fs.existsSync(logPath)) return;
        const out = path.join(dir, 'appium.log');
        const CAP = 4 * 1024 * 1024;
        const stat = fs.statSync(logPath);
        if (stat.size > CAP) {
            const fd = fs.openSync(logPath, 'r');
            const buf = Buffer.alloc(CAP);
            fs.readSync(fd, buf, 0, CAP, stat.size - CAP);
            fs.closeSync(fd);
            fs.writeFileSync(out, buf);
        } else {
            fs.copyFileSync(logPath, out);
        }
    } catch (e) {
        fs.writeFileSync(path.join(dir, 'appium.log.error.txt'),
            `captureAppiumLog threw: ${e && e.message}`);
    }
}

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
            // Shell-redirect to a file rather than capturing via Node — piping
            // simctl's output through spawnSync throws ENOBUFS regardless of maxBuffer.
            const rawPath = path.join(dir, 'device.log.raw');
            const r = spawnSync('sh', ['-c',
                `xcrun simctl spawn ${process.env.SIM_UDID} log show --last 5m --style syslog > '${rawPath}'`,
            ], { stdio: ['ignore', 'inherit', 'inherit'] });
            if (r.status !== 0) {
                throw new Error(`xcrun exited ${r.status}${r.error ? ': ' + r.error.message : ''}`);
            }
            const filtered = fs.readFileSync(rawPath, 'utf8')
                .split('\n')
                .filter((l) => /(Waterbug\[\d+\]:|TiAPI|TiLog)/.test(l))
                .filter((l) => !/XCTAutomationSupport/.test(l))
                .slice(-2000)
                .join('\n');
            fs.writeFileSync(path.join(dir, 'device.log'), filtered);
            // Keep the raw log as a fallback when the filter misses, capped to bound artifact size.
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
