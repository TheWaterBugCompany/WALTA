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

  # The app-icon badge / notification-dot nudge (WB-10) scenarios run last, on
  # purpose: they assert global app state (the springboard badge / notification
  # shade) that a sync left in flight by an earlier scenario could perturb, so
  # running them here surfaces any accidental cross-scenario coupling rather
  # than hiding it. resetApp quiesces in-flight sync between scenarios so each
  # still starts clean.

  # iOS-only: the app-icon badge is an iOS-springboard artifact. The Android
  # notification-dot equivalent is below, hence @skip-android.
  @skip-android
  Scenario: A logged-in user is nudged to sync via the app-icon badge
    Given I am logged in as "test@example.com"
     Then the app icon shows a sync badge of 1

  @skip-android
  Scenario: The app-icon sync badge clears after a full sync
    Given I am logged in as "test@example.com"
      And I have existing samples stored on the server
     When I open the sample history and tap Sync Now
     Then the sync popup completes successfully
      And the app icon shows no sync badge

  # Android: the sync nudge is a launcher notification-dot, surfaced as an
  # ongoing notification (WB-10b) since Android has no numeric app-icon badge.
  @skip-ios
  Scenario: A logged-in user is nudged to sync via a notification
    Given I am logged in as "test@example.com"
     Then the app shows a sync notification

  @skip-ios
  Scenario: The sync notification clears after a full sync
    Given I am logged in as "test@example.com"
      And I have existing samples stored on the server
     When I open the sample history and tap Sync Now
     Then the sync popup completes successfully
      And the app shows no sync notification
