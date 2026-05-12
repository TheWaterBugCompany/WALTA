Feature: Sync Samples

I want to synchronise sample changes between the device and the server,
and review what the sync did via the diagnostic log pane.

Scenario: User initiates sync from sample history
  Given I am logged in as "test@example.com"
    And I have existing samples stored on the server
   When I open the sample history and tap Sync Now
   Then the sync popup completes successfully
   When I tap Show Logs in the sync popup
   Then the log pane shows sync activity from the Logger
   # WB-62: re-enable once the Android-only "Close button not findable
   # after Show Logs opens" failure is diagnosed. iOS passes this step;
   # Android cucumber CI does not. Cucumber's Before hook terminates
   # the app between scenarios so the popup is torn down regardless.
   # When I close the sync popup

Scenario: Diagnostic logs persist across app restart
  Given I am logged in as "test@example.com"
    And I have existing samples stored on the server
   When I open the sample history and tap Sync Now
    And I tap Show Logs in the sync popup
    And I remember the first 3 lines of the log pane
    And I close and reopen the app
    And I open the sample history and tap Sync Now
    And I tap Show Logs in the sync popup
   Then the log pane still contains the remembered lines
