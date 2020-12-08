Feature: Attach DNA sample id

Given: I have filled out the sample tray and ready to submit a sample
When: I go to the submit screen
Then: A screen opens asking if there are is a sample 
 And: I enter a gene sample Id and select submit
Then: there is a sample id attached to the sample record
