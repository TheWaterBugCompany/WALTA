Given(/^I have found a species to identify$/) do
  @current_page = page(MenuScreen).await
end

When(/^I select the ALT key function$/) do
  @current_page.select_alt_key
end

Then(/^the initial binary ALT key question is displayed$/) do
 @current_page = page(QuestionScreen).await
 @current_page.verify_questions('Animal with a shell', 'Animal without a shell')
end

Given(/^a binary ALT question is displayed$/) do
  @current_page = page(MenuScreen).await
  @current_page.select_alt_key
  @current_page = page(QuestionScreen).await
  @current_page.verify_questions('Animal with a shell', 'Animal without a shell')
end

When(/^I select either the first or second answer$/) do
  @current_page.select_question('Animal with a shell')
  @current_page = page(QuestionScreen).await
end

Then(/^the next node from the ALT key is displayed$/) do
  expect( @current_page.is_a?(QuestionScreen) ).to be true
  @current_page.verify_questions('Animals look like snails or limpets.', 'Animals look like mussels.')
end

Given(/^A leaf node of the ALT is displayed$/) do
  @current_page = page(MenuScreen).await
  @current_page.select_alt_key
  @current_page = page(QuestionScreen).await
  @current_page.select_question('Animal with a shell')
  @current_page.select_question('Animals look like snails or limpets.')
  @current_page.select_question('Animals look like limpets.')
  @current_page = page(TaxonScreen).await
  

end

When(/^I select the store operation$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Then(/^selected identification is stored into the current sample tray$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^a node from the ALT key is displayed$/) do
  pending # Write code here that turns the phrase above into concrete actions
end


Given(/^I don't think this is the correct place in the key$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

When(/^I select the back button$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Then(/^the parent node of this ALT node is displayed$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^inside the ALT key identification process$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^I'm done with the key$/) do
  pending # Write code here that turns the phrase above into concrete actions
end


When(/^I press the Home button$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Then(/^the ALT key process is exited$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^it has images attached$/) do
  pending # Write code here that turns the phrase above into concrete actions

end

When(/^I select the images$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Then(/^a photo gallery is displayed$/) do
  pending # Write code here that turns the phrase above into concrete actions
end



Given(/^the photo gallery is displayed$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^there are multiple images$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

When(/^I swipe left or right$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Then(/^the next image is displayed$/) do

  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^it has a video attached$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

When(/^I select the video$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Then(/^the video player is opened$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^the video player is displayed$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

When(/^I select the play button$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Then(/^the video starts playing$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^the video is playing$/) do

  pending # Write code here that turns the phrase above into concrete actions
end

When(/^I select the pause button$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Then(/^the video pauses$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^the video player or photo gallery is displayed$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Given(/^the video is paused$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

Then(/^the video player or photo gallery is closed$/) do
  pending # Write code here that turns the phrase above into concrete actions
end

When(/^I select the close button$/) do
  pending # Write code here that turns the phrase above into concrete actions
end
