Feature: Login
  Validate the login form behaviour

  Scenario: Show login form on first load
    Given the app is open
    Then I should see the login form

  Scenario: Switch to register form
    Given the app is open
    When I click the register link
    Then I should see the register form

  Scenario: Login with invalid credentials shows error
    Given the app is open
    When I enter "notvalid@test.com" as email and "wrongpassword" as password
    And I submit the login form
    Then I should see a login error message

  Scenario: Successful login
    Given the app is open
    When I log in with valid credentials
    Then I should see the lobby page
