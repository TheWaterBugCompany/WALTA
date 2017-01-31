Feature: Submit Sample

I want to calculate the signal score of my sample, enter data about a
site and submit this sample to the database when internet is available.

Scenario: Upload a sample
  Given the user just stored a sample
    and user is logged in with a server upload account
    And the server instrument data has been downloaded
  Then the user selects the habitat type
   And the user is prompted to enter the data for the following site fields:
    | Rainfall |
    | Ph       |
    | EC       |
    | ..       | # note presumably a bunch more that I forget
   And for each field the user selects from the available instrument type
      # instrument types are downloaded from server and there can be
      # different lists for different fields.

Scenario: Download metadata when server is reachable
  When the server becomes reachable
  Then download the instrument data from the server

Scenario: Upload a sample when server is reachable
  Given one or more samples have been stored but not uploaded
   When the server becomes reachable
   Then all the pending samples are uploaded to the server
