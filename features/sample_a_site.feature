Feature: Sample A Site

I want to sample a site by doing a survey and identifying all the
taxa I've collected.

Scenario: Sample collection
  Given I am logged in as "test@example.com"
    And the GPS has a fix
    And a user has arrived at a site to sample
  When the user fills out the site details
   And the user fills out the habitat screen
   And the user identifies a number of taxa
  Then the sample tray is filled with each identification
  When the user marks the sample as complete
  Then a signal score is calculated and displayed to the user
    # UX: could use traffic light metaphor
   And a sample id is automatically created for the user
   And a sample is stored and sample tray is cleared

# A training session leaves the training service holding a session tray. That
# state must not leak into a subsequent real survey: before the fix, the survey's
# "Add to sample" was routed as a training identification, so the taxon editor
# never opened and the tray stayed empty.
Scenario: A survey after a training session still records identifications
  Given I am logged in as "test@example.com"
    And the GPS has a fix
    And a user has arrived at a site to sample
  When I open the Academy from the menu
   And I start the training session "999"
   And I identify a gastropod through the key
   And I identify a freshwater limpet through the key
   And I assess the training tray
   And I re-identify the limpet as a mussel
   And I assess the training tray
   And I finish the training
   And the user fills out the site details
   And the user fills out the habitat screen
   And the user identifies a number of taxa
  Then the sample tray is filled with each identification

@skip
Scenario: Cancel sample
  Given the user has identified a number of taxa
    But wants to start again by clearing the tray
   When the user choose the clear tray operation
   Then all the contents of the current tray are removed
