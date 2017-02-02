Feature: Polytaxonomic Identification

I want to be able to stop at any point in the binary key.
For example, where usually the user needs to select a branch to
further refine the identification, enable the ability to stop
refining identification before reaching a leaf node.

Scenario: I want to identify a taxa but I can't complete key
  Given the ALT question key is open
   When the store operation is activated
   Then the selected question node is stored into the sample

Scenario: I want to restrict my users to Order only identification
  Given the app is configured to "Order only" identification
    And the ALT key is at the order level
   Then drilling deeper is disabled

Scenario: Speedbug with order only identification
     Given the app is configured to "Order only" identification
       And node is selected from Speedbug that is deeper than order
      Then the nearest parent node at the order level is displayed
       And drilling deeper is disabled
