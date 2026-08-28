Feature: Academy

I want to test my waterbug identification skills by starting a training session

# The training flow is entirely local (no network calls), so it works offline.
Scenario: Complete a training exercise, correcting a mistake
  When I open the Academy from the menu
  And I start the training session "999"
  Then an empty training tray is shown
  When I identify a gastropod through the key
  And I identify a freshwater limpet through the key
  And I assess the training tray
  Then an incorrect taxon is highlighted
  When I select the incorrect taxon
  Then the comparison shows the mussel beside the limpet I chose
  When I ask which question I got wrong
  Then the key marks the branch I should have taken
  When I choose the mussel instead
  And I assess the training tray
  Then the training success screen is shown
  When I finish the training
  Then the menu is shown
