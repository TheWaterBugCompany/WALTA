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
