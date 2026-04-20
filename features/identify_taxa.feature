Feature: Identify Taxa

Having found a species I would like to identify its taxa.

@skip
Scenario: Add a taxon to the sample
  Given I identify and store a Taxon
   Then the EditTaxon screen is opened
   When I set the abundance to "3-5"
    And I save the taxon
   Then the taxon displays "3-5" for the abundance

@skip
Scenario: Identify taxa via ALT key
  Given I have found a species to identify
   When I select the ALT key function
   Then the initial binary ALT key question is displayed

@skip
Scenario: Binary ALT question
   Given a binary ALT question is displayed
   When I select either the first or second answer
   Then the next node from the ALT key is displayed

@skip
Scenario: Taxon node is selected
  Given A leaf node of the ALT is displayed
  When I select the store operation
  Then selected identification is stored into the current sample tray

Scenario: Backwards navigation up the tree
  Given a node from the ALT key is displayed
    And I don't think this is the correct place in the key
   When I select the back button
   Then the parent node of this ALT node is displayed

@skip
Scenario: View species photo gallery
  Given a node from the ALT key is displayed
    And it has images attached
   When I select the images
   Then a photo gallery is displayed

@skip
Scenario: View species with multiple images
  Given the photo gallery is displayed
   And there are multiple images
   When I swipe left or right
   Then the next image is displayed

@skip
Scenario: View species video
   Given a node from the ALT key is displayed
     And it has a video attached
    When I select the video
    Then the video player is opened

@skip
Scenario: Play video
   Given the video player is displayed
     And the video is paused
    When I select the play button
    Then the video starts playing

@skip
Scenario: Pause video
   Given the video player is displayed
     And the video is playing
    When I select the pause button
    Then the video pauses

@skip
Scenario: Close gallery or video player
   Given the video player or photo gallery is displayed
    When I select the close button
    Then the video player or photo gallery is closed
