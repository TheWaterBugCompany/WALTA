Given(/^I am not logged in$/) do
    @current_page = page(MenuScreen).await
    if @current_page.loggedIn?
        @current_page.log_out
    end
    expect( @current_page.loggedIn? ).to eq(false)
end

Given(/^the user "([^"]*)" does not exist$/) do |emailAddress|
    Mirage::Client.new.put( 'user/create', <<-eos
        {
            "name": "Test Example",
            "email": "test-1536403292821@example.com",
            "group": 0,
            "survey_consent": 0,
            "share_name_consent": 0,
            "oauth_network": null,
            "updated_at": "2018-09-08 10:41:33",
            "created_at": "2018-09-08 10:41:33",
            "id": 102,
            "accessToken": "testuseraccesstoken"
        }     
eos
         ) do
        http_method :post
        status 200
    end
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
    Mirage::Client.new.put( 'token/create', <<-eos
        {
            "id": 38,
            "name": "Test Example",
            "email": "testlogin@example.com",
            "created_at": "2018-09-07 08:55:30",
            "updated_at": "2018-09-07 08:55:30",
            "group": 0,
            "survey_consent": 0,
            "share_name_consent": 0,
            "oauth_network": null,
            "accessToken": "testusertoken"
        }     
eos
         ) do
        http_method :post
        status 200
    end
end
  
When(/^I log in via username and password$/) do
    @current_page = page(MenuScreen).await
    @current_page = @current_page.log_in( @emailAddress, @password )
    serverReq = JSON.parse( Mirage::Client.new.requests(2).body )
    puts serverReq.inspect
    expect( serverReq["email"] ).to eq(@emailAddress)
    expect( serverReq["password"] ).to eq(@password)
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
  
  When(/^I log in with "([^"]*)" and password "([^"]*)"$/) do |arg1, arg2|
    pending # Write code here that turns the phrase above into concrete actions
  end
  