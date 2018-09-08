@mockserver
Feature: Registration

I want to be able to register with WaterbugBlitz to allow uploading samples.

Scenario: Register
  Given I am not logged in
    And the user "testuser@example.com" does not exist
  When I register as "testuser@example.com"
  Then I am registered on the server
   And I am logged in

Scenario: Remember log in over app restart
  Given The "testuser@example.com" account exists with password "t3stPassw0rd"
     And I am not logged in
    When I log in via username and password
     And I restart the application
    Then I am logged in
   
Scenario: Correctly responds to server login errors
  Given the server is returning a 500 error
    And I am not logged in
    When I log in via username and password
    Then I get an error message

Scenario: Correctly responds to server registration errors
  Given the server is returning a 500 error
    And I am not logged in
    When I register as "testuser@example.com"
    Then I get an error message

Scenario: Register with existing email address
  Given I am not logged in
    And the user "testuser@example.com" is already registered
   When I register as "testuser@example.com"
   Then I get an error message

Scenario: Log in with bad credentials
 Given The "testuser@example.com" account exists with password "t3stPassw0rd"
     And I am not logged in
    When I log in with "testuser@example.com" and password "badpassword"
    Then I get an error message

Scenario: Log in with existing account
   Given The "testuser@example.com" account exists with password "t3stPassw0rd"
     And I am not logged in
    When I log in via username and password
    Then I am logged in 
