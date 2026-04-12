Feature: Game history
  Validate the history page content

  Background:
    Given I am logged in

  Scenario: History page shows the title
    When I click the "History" nav link
    Then I should see the history page

  Scenario: History page shows a message when no games exist
    When I click the "History" nav link
    Then I should see a history status message
