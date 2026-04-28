@mockserver
Feature: Upload Samples

I want submit this sample to the database when internet is available.

Scenario: User initiates sync from sample history
  Given I have existing samples stored on the server
   When I open the sample history and tap Sync Now
   Then the sync popup completes successfully

@skip
Scenario: Upload a sample when server is reachable
  Given I am logged in as "text@example.com.au"
    And one or more samples have been stored but not uploaded
   When the server becomes reachable
   Then all the pending samples are uploaded to the server
