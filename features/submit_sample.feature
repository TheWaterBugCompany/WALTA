@mockserver
Feature: Upload Samples

I want submit this sample to the database when internet is available.

Scenario: Upload a sample when server is reachable
  Given I am logged in as "text@example.com.au"
    And one or more samples have been stored but not uploaded
   When the server becomes reachable
   Then all the pending samples are uploaded to the server
