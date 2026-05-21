'use strict';
const { Given, When, Then } = require('@cucumber/cucumber');
Given('I am not logged in', function() {
});

// Password is fixed to match the mock CERDI server's /token/create stub.
// `mobile: deepLink` (not driver.url, which Android routes via Chrome and
// drops custom schemes) sends the walta://login intent straight to the app.
Given('I am logged in as {string}', {timeout: 120000}, async function(emailAddress) {
    // Wait for boot first: a deeplink fired before boot is treated as a
    // cold-launch intent without the cerdiServerUrl/Secret extras, so CerdiApi
    // builds against prod and login silently never reaches the mock.
    await this.menu.waitFor();
    const url = `walta://login?email=${encodeURIComponent(emailAddress)}&password=password`;
    if (this.platform === 'android') {
        await this.driver.execute('mobile: deepLink', {
            url,
            package: 'net.thewaterbug.waterbug',
            waitForLaunch: false,
        });
    } else {
        await this.driver.execute('mobile: deepLink', {
            url,
            bundleId: 'net.thewaterbug.waterbug',
        });
    }
    await this.menu.waitForLabel("You are Logged in");
    // iOS re-opens the Menu on LOGGEDIN; let it settle to avoid a stale click.
    if (this.platform === 'ios') {
        await new Promise(r => setTimeout(r, 1500));
    }
});

Given('the user "([^"]*)" does not exist', function(emailAddress) {
});

Then('I am registered on the server', function() {
});

Then('I am logged in', {timeout: 60000}, async function() {
    await this.menu.waitForLabel("You are Logged in");
});

// 5-min timeout: form-fill + dismissSavePasswordSheet's own 60s sheet wait
// exceed the 60s budget on cold-start CI runners (warm local sims are fine).
When('I log in with {string} and password {string}', {timeout: 300000}, async function(emailAddress, password) {
    await this.menu.waitFor();
    await this.menu.login(emailAddress, password);
});

When('I register as "([^"]*)"', function(emailAddress) {
});

Given('The {string} account exists with password {string}', function(emailAddress, password) {
    global.mockCerdiServer.registerAccount({ email: emailAddress, password });
});

When('I restart the application', function() {
    return 'pending';
});

Given('the server is returning a (\d+) error', function(arg1) {
    return 'pending';
});

Then('I get an error message', function() {
    return 'pending';
});

Given('the user "([^"]*)" is already registered', function(arg1) { 
    return 'pending';
});