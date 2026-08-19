'use strict';
const { Given, After } = require('@cucumber/cucumber');
const { TEST_LAT, TEST_LNG, startGpsBroadcaster, stopGpsBroadcaster } = require('../support/gps-broadcaster');

Given('the GPS has a fix', async function () {
    await startGpsBroadcaster(this, TEST_LAT, TEST_LNG);
});

After(function () {
    stopGpsBroadcaster(this);
});
