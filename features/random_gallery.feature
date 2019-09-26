Feature: Random Gallery

I just want to pretty pictures of insects

Scenario: Opening random gallery
  When I select the random gallery
  Then A photo gallery with a random selection of 20 images is opened
  When the photo gallery is closed
  Then the menu screen appears
