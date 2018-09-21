Given(/^I am not logged in$/) do
    @current_page = page(MenuScreen).await
    if @current_page.loggedIn?
        @current_page.log_out
    end
    expect( @current_page.loggedIn? ).to eq(false)
end

Given(/^I am logged in as "([^"]*)"$/) do |emailAddress|
    MockServer.create_account()
    @current_page = RegistrationDriver.login( emailAddress, "password" )
    expect( @current_page.loggedIn? ).to eq(true)
end

Given(/^the user "([^"]*)" does not exist$/) do |emailAddress|
    MockServer.create_user_does_not_exist()
end

Then(/^I am registered on the server$/) do
   serverReq = JSON.parse( Mirage::Client.new.requests(2).body )
   expect( serverReq["email"] ).to eq(@emailAddress)
   expect( serverReq["name"] ).to eq("Test User")
   expect( serverReq["password"] ).to eq("t3stPassw0rd")
   expect( serverReq["group"] ).to eq(false)
   expect( serverReq["survey_consent"] ).to eq(false)
   expect( serverReq["share_name_consent"] ).to eq(false)
end

Then(/^I am logged in$/) do
    expect( @current_page.loggedIn? ).to eq(true)
end

When(/^I log in with "([^"]*)" and password "([^"]*)"$/) do |emailAddress, password|
    @current_page = RegistrationDriver.login( emailAddress, password )
end

When(/^I register as "([^"]*)"$/) do |emailAddress|
    @emailAddress = emailAddress
    @current_page = page(MenuScreen).await
    @current_page = @current_page.select("Log In")
    @current_page = page(LoginScreen).await
    @current_page = @current_page.select("Register")
    @current_page = page(RegisterScreen).await
    sleep 0.5
    @current_page = @current_page.register_via_email( emailAddress, "Test User", "t3stPassw0rd")
end

Given(/^The "([^"]*)" account exists with password "([^"]*)"$/) do |emailAddress, password|
    @emailAddress = emailAddress
    @password = password
    MockServer.create_account()
end
  
When(/^I log in via username and password$/) do
   @current_page = RegistrationDriver.login( @emailAddress, @password )
end

When(/^I restart the application$/) do
    pending # Write code here that turns the phrase above into concrete actions
  end
  
  Given(/^the server is returning a (\d+) error$/) do |arg1|
    pending # Write code here that turns the phrase above into concrete actions
  end
  
  Then(/^I get an error message$/) do
    pending # Write code here that turns the phrase above into concrete actions
  end
  
  Given(/^the user "([^"]*)" is already registered$/) do |arg1|
    pending # Write code here that turns the phrase above into concrete actions
  end
  
  
  