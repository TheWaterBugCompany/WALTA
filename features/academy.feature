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
  When I re-identify the limpet as a mussel
  And I assess the training tray
  Then the training success screen is shown
  When I finish the training
  Then the menu is shown
