Feature: Account

I want to see and manage the account I am signed in to

# Deleting an account cannot be undone, so the password is proved against the
# server before anything is destroyed. Mistyping it is covered by the unit and
# device specs: the alert that reports it is a native dialogue, and while one is
# up the driver cannot see the app behind it to assert on what was left alone.
Scenario: Delete my account
  Given I am logged in as "test@example.com"
  When I open my account from the menu
  And I choose to delete my account
  Then I am warned that deleting my account cannot be undone
  When I delete my account with my password
  Then I am logged out

Scenario: Change my mind about deleting my account
  Given I am logged in as "test@example.com"
  When I open my account from the menu
  And I choose to delete my account
  And I close the delete account dialogue
  Then my account details are shown, untouched
