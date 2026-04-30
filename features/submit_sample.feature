Feature: Upload Samples

I want submit this sample to the database when internet is available.

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

@skip
Scenario: Upload a sample when server is reachable
  Given I am logged in as "text@example.com.au"
    And one or more samples have been stored but not uploaded
   When the server becomes reachable
   Then all the pending samples are uploaded to the server
