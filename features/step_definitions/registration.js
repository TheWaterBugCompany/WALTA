'use strict';
const { Given, When, Then } = require('@cucumber/cucumber');
Given('I am not logged in', function() {
/*     @current_page = page(MenuScreen).await
    if @current_page.loggedIn?
        @current_page.log_out
    end
    expect( @current_page.loggedIn? ).to eq(false) */
});

// Logs in via the `walta://login` deeplink — the app's UrlActions
// dispatcher calls CerdiApi.loginUser then fires Topics.LOGGEDIN, which
// the menu controller observes. Password is fixed to match the mock
// CERDI server's /token/create stub.
//
// `driver.url` on Android UiAutomator2 routes the URL via Chrome,
// which won't deliver custom schemes reliably. `mobile: deepLink` /
// `mobile: deepLink` (iOS) sends the intent directly to the app.
Given('I am logged in as {string}', {timeout: 60000}, async function(emailAddress) {
    // Wait for the app to be fully booted FIRST. The launcher intent
    // (mobile: startActivity) carries cerdiServerUrl/cerdiApiSecret as
    // extras; alloy.js reads those and builds CerdiApi against the mock
    // server. If we fire the deeplink before that boot completes, the
    // OS treats the deeplink as a cold-launch intent (no extras) and
    // CerdiApi is built against the production sandbox URL — login then
    // never reaches the mock and the test silently passes the menu wait
    // but is never actually authenticated.
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
    // Wait for the "You are Logged in" label to appear in the Menu —
    // this is the deterministic UI signal that LOGGEDIN fired and the
    // menu re-rendered with logged-in state. Replaces a fixed sleep
    // that was sometimes too short on iOS post-reinstall.
    await this.menu.waitForLabel("You are Logged in");
    // On iOS, LOGGEDIN → HOME → Navigation.openController("Menu") tears
    // down the existing Menu and opens a new one; the label appears on
    // the new instance, but immediate clicks can race against the
    // tear-down. A brief settle avoids stale-element clicks.
    if (this.platform === 'ios') {
        await new Promise(r => setTimeout(r, 1500));
    }
});

Given('the user "([^"]*)" does not exist', function(emailAddress) {
/*     MockServer.create_user_does_not_exist() */
});

Then('I am registered on the server', function() {
/*    serverReq = JSON.parse( Mirage::Client.new.requests(2).body )
   expect( serverReq["email"] ).to eq(@emailAddress)
   expect( serverReq["name"] ).to eq("Test User")
   expect( serverReq["password"] ).to eq("t3stPassw0rd")
   expect( serverReq["group"] ).to eq(false)
   expect( serverReq["survey_consent"] ).to eq(false)
   expect( serverReq["share_name_consent"] ).to eq(false) */
});

Then('I am logged in', {timeout: 60000}, async function() {
    await this.menu.waitForLabel("You are Logged in");
});

When('I log in with {string} and password {string}', {timeout: 60000}, async function(emailAddress, password) {
    await this.menu.waitFor();
    await this.menu.login(emailAddress, password);
});

When('I register as "([^"]*)"', function(emailAddress) {
/*     @emailAddress = emailAddress
    @current_page = page(MenuScreen).await
    @current_page = @current_page.select("Log In")
    @current_page = page(LoginScreen).await
    @current_page = @current_page.select("Register")
    @current_page = page(RegisterScreen).await
    sleep 0.5
    @current_page = @current_page.register_via_email( emailAddress, "Test User", "t3stPassw0rd") */
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