Feature: Quality Control with Photos

I want to be able to record a photo or a video and attach it
to my site samples to help experts validate my identification.

Scenario: Identification of a taxa with photo or video
   Given I have identified a taxa
    When A photo/viseo is taken with the camera
    Then the photo/video is associated with taxa sample

Scenario: Viewing photos on sample
   Given I have a sample with videos/photos attached
    When I open the sample 
    Then I can add/remove the media on a sample

Scenario: Uploading media
   Given I have completed a sample
    And it is being uploaded to the server
   Then any media attached is uploaded
