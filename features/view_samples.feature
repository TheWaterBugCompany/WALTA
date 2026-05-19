Feature: View samples

I want to review the history of the samples I have already collected.

@skip
Scenario: Review history without server login
  Given I do not have a server login
    And I have stored one or more samples
   When I enter the sample history and select a sample
   Then the signal score, fields and metadata are displayed
    And the user can see the sample tray as it was for the selected sample
    And the user can view a graphical visualisation of signal score

Scenario: Creature photos remain visible after sync
  Given I am logged in as "test@example.com"
    And I have existing samples stored on the server
   When I open the sample history and tap Sync Now
   Then the sync popup completes successfully
   When I close the sync popup
    And I open the sample tray for the downloaded sample
   Then I can see each creature with its abundance
   When I select the creature with taxon id 12
   Then the creature photo matches the expected image
   When I close the creature detail
    And I select the creature with taxon id 11
   Then the creature photo matches the expected image
