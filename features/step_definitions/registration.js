const { Given, When, Then } = require('cucumber');
Given('I am not logged in', function() {
/*     @current_page = page(MenuScreen).await
    if @current_page.loggedIn?
        @current_page.log_out
    end
    expect( @current_page.loggedIn? ).to eq(false) */
});

Given('I am logged in as "([^"]*)"', function(emailAddress) {
/*     MockServer.create_account()
    @current_page = RegistrationDriver.login( emailAddress, "password" )
    expect( @current_page.loggedIn? ).to eq(true) */
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

Then('I am logged in', function() {
/*     expect( @current_page.loggedIn? ).to eq(true) */
});

When('I log in with "([^"]*)" and password "([^"]*)"', function(emailAddress, password) {
/*     @current_page = RegistrationDriver.login( emailAddress, password ) */
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

Given('The "([^"]*)" account exists with password "([^"]*)"', function(emailAddress, password) {
/*     @emailAddress = emailAddress
    @password = password
    MockServer.create_account() */
});
  
When('I log in via username and password', function() {
/*    @current_page = RegistrationDriver.login( @emailAddress, @password ) */
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