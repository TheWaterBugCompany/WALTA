'use strict';
// The e2e suite's failure capture — what a red run leaves behind for whoever
// has to diagnose it. See end-to-end-testing/capture-failure.js.
const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { captureFailure } = require('../end-to-end-testing/capture-failure');

function fakeDriver(overrides) {
    return Object.assign({
        takeScreenshot: async () => Buffer.from('png-bytes').toString('base64'),
        getPageSource: async () => '<hierarchy/>',
        getLogs: async () => [
            { timestamp: 1, level: 'INFO', message: 'first line' },
            { timestamp: 2, level: 'ERROR', message: 'second line' },
        ],
    }, overrides);
}

describe('e2e failure capture', function () {
    let root;

    beforeEach(function () {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'capture-'));
    });

    function captured(name) {
        return fs.readFileSync(path.join(root, 'a_failing_test', name), 'utf8');
    }

    function capturedNames() {
        return fs.readdirSync(path.join(root, 'a_failing_test')).sort();
    }

    it('saves the screen and the view tree under a directory named for the test', async function () {
        await captureFailure({ driver: fakeDriver(), platform: 'android', title: 'a failing test', root });

        expect(capturedNames()).to.include.members(['screenshot.png', 'page-source.xml']);
        expect(captured('page-source.xml')).to.equal('<hierarchy/>');
    });

    // Without the device's own log a blank screen says only *that* the app
    // failed, never why — the run is undiagnosable after the fact.
    it('saves the device log alongside them', async function () {
        await captureFailure({ driver: fakeDriver(), platform: 'android', title: 'a failing test', root });

        expect(captured('device-log.txt')).to.contain('first line').and.contain('second line');
    });

    it('asks Android for logcat', async function () {
        const asked = [];
        const driver = fakeDriver({ getLogs: async (type) => { asked.push(type); return []; } });

        await captureFailure({ driver, platform: 'android', title: 'a failing test', root });

        expect(asked).to.deep.equal(['logcat']);
    });

    it('asks iOS for syslog', async function () {
        const asked = [];
        const driver = fakeDriver({ getLogs: async (type) => { asked.push(type); return []; } });

        await captureFailure({ driver, platform: 'ios', title: 'a failing test', root });

        expect(asked).to.deep.equal(['syslog']);
    });

    // Whichever capture the failure has broken, the others still have to land —
    // they are the evidence, and a half-captured failure is a wasted CI run.
    it('still captures the screen and view tree when the log is unavailable', async function () {
        const driver = fakeDriver({ getLogs: async () => { throw new Error('log type not supported'); } });

        await captureFailure({ driver, platform: 'android', title: 'a failing test', root });

        expect(capturedNames()).to.include.members(['screenshot.png', 'page-source.xml']);
        expect(captured('device-log.error.txt')).to.contain('log type not supported');
    });

    it('still captures the log when the screenshot is unavailable', async function () {
        const driver = fakeDriver({ takeScreenshot: async () => { throw new Error('no screen'); } });

        await captureFailure({ driver, platform: 'android', title: 'a failing test', root });

        expect(captured('device-log.txt')).to.contain('first line');
        expect(captured('screenshot.error.txt')).to.contain('no screen');
    });
});
