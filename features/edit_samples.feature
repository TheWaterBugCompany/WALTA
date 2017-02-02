Feature: Edit existing samples

I want to be able to edit samples I have already completed.

Scenario: Edit sample
   Given I have already completed a sample
    When I activate the sample edit mode
    Then I can add/remove new species

Scenario: Synchronise edited samples
   Given I have updated already complete samples
    When the server becomes reachable
    Then the new samples are uploaded and reploace the old
