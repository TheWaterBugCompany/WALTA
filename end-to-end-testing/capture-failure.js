'use strict';
// What a failing e2e test leaves behind: the screen, the view tree, and the
// device's own log. Each is captured independently — the one that survives a
// broken driver is often the one that names the cause.
const fs = require('fs');
const path = require('path');

const DEVICE_LOG_TYPE = { android: 'logcat', ios: 'syslog' };

async function captureFailure({ driver, platform, title, root }) {
    const dir = path.join(root, title.replace(/[^a-zA-Z0-9-]+/g, '_').slice(0, 80));
    fs.mkdirSync(dir, { recursive: true });

    await save(dir, 'screenshot.png', async () => Buffer.from(await driver.takeScreenshot(), 'base64'));
    await save(dir, 'page-source.xml', () => driver.getPageSource());
    await save(dir, 'device-log.txt', async () => {
        const entries = await driver.getLogs(DEVICE_LOG_TYPE[platform]);
        return entries.map(formatLogEntry).join('\n');
    });
}

function formatLogEntry(entry) {
    if (typeof entry === 'string') return entry;
    return [entry.timestamp, entry.level, entry.message].filter(Boolean).join(' ');
}

async function save(dir, name, produce) {
    try {
        fs.writeFileSync(path.join(dir, name), await produce());
    } catch (e) {
        const stem = name.replace(/\.[^.]*$/, '');
        fs.writeFileSync(path.join(dir, `${stem}.error.txt`), String(e && e.message));
    }
}

exports.captureFailure = captureFailure;
