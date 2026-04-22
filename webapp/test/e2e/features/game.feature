Feature: Game setup and play
  Validate game configuration and board interaction

  Background:
    Given I am logged in
    And I navigate to the Play page

  Scenario: Start a game with default settings
    When I click the start game button
    Then I should see the game board

  Scenario: Select board size 5 and start
    When I select board size 5
    And I click the start game button
    Then I should see the game board

  Scenario: Select difficulty hard and start
    When I select difficulty "hard"
    And I click the start game button
    Then I should see the game board

  Scenario: Game board shows a hex cell
    When I click the start game button
    Then I should see at least one hex cell on the board
