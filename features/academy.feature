Feature: Academy

I want to test my waterbug identification skills by starting a training session

Scenario: Enter a training session code
  When I open the Academy from the menu
  Then the Academy training screen appears
  When I enter the session code "123"
  Then I can start the training session
  When I close the Academy
  Then the menu is shown
