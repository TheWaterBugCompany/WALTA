Feature: Quality Control with Photos

When I identify a taxa I want to be able to record a photo or a video
to help experts check the quality of my identification.

Scenario: Identification of a taxa with photo or video
   Given I have identified a taxa
    When I select the camera option on that taxa sample
    Then the camera app is loaded
    When I take a photo or a video
    Then the photo/video is associated with taxa sample

Scenario: Viewing photos on sample
   Given I have a sample with videos/photos attached
    When I activate the review photos option
    Then A photo gallery is (or video player) is opened
      # see identify_taxa.feature for how photo/video player operates

Scenario: Remove existing photos
   Given I have attached photos to a taxa sample
     And the gallery is opened
    When I select the remove option
    Then the currently display photo or video is removed from taxa sample

Scenario: Uploading media
   Given I have completed a sample
    And it is being uploaded to the server
   Then upload any media attached
