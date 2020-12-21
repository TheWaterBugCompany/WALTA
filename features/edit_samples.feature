@mockserver
Feature: Edit samples

I want to be able to edit samples I have already completed.

Scenario: Edit sample
   Given I have already completed a sample
    When I activate the sample edit mode
    Then I can add or remove new species

Scenario: Synchronise edited samples
   Given I have updated already complete samples
    When I edit an exist sample
    When the server becomes reachable
    Then the new samples are uploaded and replace the old

@only
Scenario: Download samples from server
   Given I have existing samples stored on the server
    When the server becomes reachable
    Then the new samples are downloaded to the phone