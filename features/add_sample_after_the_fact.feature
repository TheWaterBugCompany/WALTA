Feature: Add a sample after the fact

I want to enter a sample I collected in the field earlier, choosing the
photos I already took from my phone's gallery and setting the survey date
to the day I actually collected it.

@gallery
Scenario: Enter a previously collected sample from gallery photos with a back dated survey date
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
