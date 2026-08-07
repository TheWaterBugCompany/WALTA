Feature: Academy

I want to test my waterbug identification skills by starting a training session

Scenario: A valid session code enables Start
  When I open the Academy from the menu
  Then the Academy training screen appears
  When I enter the session code "101"
  Then the training session can be started
  When I close the Academy
  Then the menu is shown

# The training flow is entirely local (no network calls), so it works offline.
# @skip until the acceptance harness can tap a key row whose outcome is a taxon
# leaf (clickByText taps the inner label, which doesn't fire the row's handler —
# an untested path; survey tests reach taxa via Browse). Tracked as a follow-up.
@skip
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
