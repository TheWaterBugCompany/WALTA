Feature: Branding and help

As a user a want to see the about screen and help screens.

Scenario: Help screen
  When the Help operation is activated
  Then the Help text is displayed

Scenario: About screen
  When the About operation is activated
  Then the About screen is displayed
