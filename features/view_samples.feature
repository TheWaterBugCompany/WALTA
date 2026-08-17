Feature: View samples

I want to review the history of the samples I have already collected.

# Regression guard for WB-243: the Summary was blank when reviewing a sample in
# Edit mode, because the view bound to the global singleton rather than the edited
# copy threaded through the flow.
Scenario: Editing a completed sample shows a populated summary
  Given I am logged in as "test@example.com"
    And the GPS has a fix
    And a user has arrived at a site to sample
  When the user fills out the site details
   And the user fills out the habitat screen
   And the user identifies a number of taxa
   And the user marks the sample as complete
   And a sample is stored and sample tray is cleared
   And I edit the stored sample from history
   And I move forward to the summary screen
  Then the summary shows the survey site and signal score

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
