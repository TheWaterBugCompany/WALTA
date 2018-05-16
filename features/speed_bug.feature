Feature: SpeedBug

I have a species with a fairly distinct silhouette and I want to jump the
the part of the ALT key that further refines by identification.

Scenario: Accelerated identification with Speedbug
  Given I want to identify via a silhouette
   When I activate Speedbug
   Then the speed bug index is displayed consisting of silhouette images
      # see the "The Waterbug App scope" documentation for details
   When I select a silhouette
   Then the ALT key jumps to the node linked to the silhouette

   Scenario: Not sure links
     Given I want to identify via a silhouette
       But I can't decide between adjacent silhouettes
      When I select the "No Sure" link
      Then the ALT key is opened at the question linked to the select "not sure" link
