Feature: Sample A Site

I want to sample a site by doing a survey and identifying all the
taxa I've collected.

Scenario: Sample collection
  Given a user has arrvied at a site to sample
  When the user identifies a number of taxa # see identify_taxa.feature
  Then the sample tray is filled with each identification
  When the user marks the sample as complete
  Then a signal score is calculated and displayed to the user
    # UX: could use traffic light metaphor
   And a sample id is automatically created for the user
   And a sample is stored and sample tray is cleared

Scenario: Cancel sample
  Given the user has identified a number of taxa
    But wants to start again by clearing the tray
   When the user choose the clear tray operation
   Then all the contents of the current tray are removed
