Feature: Taxanomic index

I already know what my bug is because I'm an expert with insects

Scenario:
   Given I have a species that I can identify by rote
    When I open the index screen
     And I find the correct species by name
     And I select the species
    Then the ALT leaf node displaying the selected species is opened
