Given(/^I am not logged in$/) do
    # do nothing 
end

Given(/^I am at the "([^"]*)" screen$/) do |screenName|
    @current_page = page(constantize(screenName.capitalize + "Screen")).await
end

Then(/^The "([^"]*)" screen is displayed$/) do |screenName|
    @current_page = page(constantize(screenName.capitalize + "Screen")).await
end

When(/^I complete the registration form$/) do
    pending # Write code here that turns the phrase above into concrete actions
end

When(/^I select "([^"]*)"$/) do |optionName|
    @current_page = @current_page.select(optionName)
end

Then(/^I am registered on the server$/) do
    pending # Write code here that turns the phrase above into concrete actions
end

Then(/^I am logged in$/) do
    pending # Write code here that turns the phrase above into concrete actions
end