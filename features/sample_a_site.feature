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

# Identifying via the key is one of the method paths that must stay enabled in a
# real survey (training mode greys all but the key; that mode must not leak here).
Scenario: Identify a creature via the key in a survey
  Given I am logged in as "test@example.com"
    And the GPS has a fix
    And a user has arrived at a site to sample
  When the user fills out the site details
   And the user fills out the habitat screen
   And the user identifies a taxon via the key
  Then the sample tray shows the key-identified taxon

@skip
Scenario: Cancel sample
  Given the user has identified a number of taxa
    But wants to start again by clearing the tray
   When the user choose the clear tray operation
   Then all the contents of the current tray are removed
