Feature: Academy

I want to test my waterbug identification skills by starting a training session

# The training flow is entirely local (no network calls), so it works offline.
# A trainee who has never trained wears the plain white belt, so the course the
# Academy offers is the first one.
Scenario: Complete a training exercise, correcting a mistake
  When I open the Academy from the menu
  And I start my next training course
  Then an empty training tray is shown
  When I identify a flatworm through the key
  And I mistake a leech for a worm through the key
  And I identify a damselfly through the key
  And I identify a mayfly through the key
  And I assess the training tray
  Then an incorrect taxon is highlighted
  When I select the incorrect taxon
  Then the comparison shows the worm beside the leech I chose
  When I ask which question I got wrong
  Then the key marks the branch I should have taken
  When I choose the worm instead
  And I assess the training tray
  Then the training success screen is shown
  When I finish the training
  Then the menu is shown
  And I am wearing a "White belt with a yellow tip"
  # A belt earned before signing in follows the trainee into their account.
  When I am logged in as "test@example.com"
  And I open my account from the menu
  Then my belts earned include a "White belt with a yellow tip"

# An unidentified cell grades as incorrect, so the feedback this scenario is
# about is reachable without walking the whole course.
Scenario: Browse to a creature from the training feedback
  When I open the Academy from the menu
  And I start my next training course
  Then an empty training tray is shown
  When I identify a flatworm through the key
  And I mistake a leech for a worm through the key
  And I assess the training tray
  Then an incorrect taxon is highlighted
  When I select the incorrect taxon
  And I tap the leech photo in the comparison
  Then the leech details are shown

# The two ids reach the comparison from different sources — the key hands out a
# string taxonId, the exercise authors a number — so a right answer once opened
# the wrong half of this modal.
Scenario: Read the feedback on a taxon identified correctly
  When I open the Academy from the menu
  And I start my next training course
  Then an empty training tray is shown
  When I identify a flatworm through the key
  And I assess the training tray
  And I select the correct taxon
  Then the comparison shows the flatworm on its own


# The training session is one per device and belongs to whoever was signed in
# when it started. Left behind at logout, the next trainee starting the same
# course was handed that tray — for a course already passed, every taxon
# correct and in position, so one more identification assessed as a pass.
Scenario: A training session does not outlive the trainee who started it
  When I am logged in as "test@example.com"
  And I open the Academy from the menu
  And I start my next training course
  Then an empty training tray is shown
  When I identify a flatworm through the key
  And I leave the training tray
  And I log out
  And I open the Academy from the menu
  And I start my next training course
  Then an empty training tray is shown
