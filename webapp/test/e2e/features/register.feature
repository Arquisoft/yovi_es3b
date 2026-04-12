Feature: Register
  Validate the register form

  Scenario: Register form requires all fields
    Given the app is open
    When I click the register link
    And I submit the login form
    Then I should see a login error message
