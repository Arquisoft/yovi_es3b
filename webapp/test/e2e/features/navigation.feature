Feature: Navigation
  Validate navbar navigation after login

  Background:
    Given I am logged in

  Scenario: Navigate to the Play page
    When I click the "Play" nav link
    Then I should see the game setup page

  Scenario: Navigate to the History page
    When I click the "History" nav link
    Then I should see the history page

  Scenario: Navigate to the Profile page
    When I click the "My Profile" nav link
    Then I should see the profile page

  Scenario: Navigate back to the Lobby
    When I click the "Play" nav link
    And I click the YOVI logo
    Then I should see the lobby page
