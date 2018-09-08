Given(/^I am not logged in$/) do
    # do nothing 
end

Given(/^I am at the "([^"]*)" screen$/) do |screenName|
    @current_page = page(constantize(screenName.capitalize + "Screen")).await
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


Then(/^The "([^"]*)" screen is displayed$/) do |screenName|
    @current_page = page(constantize(screenName.capitalize + "Screen")).await
end

When(/^I select "([^"]*)"$/) do |optionName|
    @current_page = @current_page.select(optionName)
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



When(/^I complete the registration form for "([^"]*)"$/) do |emailAddress|
    @emailAddress = emailAddress
    @current_page = @current_page.register_via_email( emailAddress, "Test User", "t3stPassw0rd")
end
