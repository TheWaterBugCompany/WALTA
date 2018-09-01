Feature: Registration

I want to be able to register with WaterbugBlitz to allow uploading samples.

Scenario: Register
  Given I am not logged in
    And I am at the "Menu" screen
  When I select "Log In" 
  Then The "Log In" screen is displayed
  When I select "Register"
  Then The "Register" screen is displayed
  When I complete the registration form
   And I select "Submit"
  Then I am registered on the server
   And The "Menu" screen is displayed
   And I am logged in

Scenario: Remeber log in over app restart
