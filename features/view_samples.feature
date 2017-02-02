Feature: View samples

I want to review the history of the samples I have already collected.

Scenario: Review history without server login
  Given I do not have a server login
    And I have stored one or more samples
   When I enter the sample history and select a sample
   Then the signal score, fields and metadata are displayed
    And the user can see the sample tray as it was for the selected sample
    And the user can view a graphical visualisation of signal score

Scenario: Review history with a login
  Given I have a user account on the server
    And I have submitted samples to the server
   When the server is reachable
   Then the history of sampled sites at the current location is downloaded from the server
    And I can review the history as per usual
