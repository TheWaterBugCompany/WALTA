Feature: Add a sample after the fact

A user who collected a sample in the field — recording the photos on a
separate camera and the date on paper — can enter it into the app later.
They choose their existing photos from the phone's gallery and back-date
the survey to the day they actually collected it.

@gallery
Scenario: Enter a previously-collected sample from gallery photos with a back-dated survey date
  Given I am logged in as "test@example.com"
    And the GPS has a fix
    And a photo is already in the phone gallery
    And a user has arrived at a site to sample
  When the user fills out the site details choosing a photo from the gallery
    And the user fills out the habitat screen
    And the user identifies a taxon choosing a photo from the gallery
    And the user back-dates the survey to "15 March 2024"
  Then the notes screen shows the survey date "15 March 2024"
  When the user completes the survey
  Then the sample is stored in the survey history
