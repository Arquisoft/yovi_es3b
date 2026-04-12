import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('the app is open', async function () {
  await this.page.goto(this.baseUrl())
})

When('I click the register link', async function () {
  await this.page.click('p button')
})

When('I enter {string} as email and {string} as password', async function (email, password) {
  await this.page.fill('#email', email)
  await this.page.fill('#password', password)
})

When('I submit the login form', async function () {
  await this.page.click('.submit-button')
})

When('I log in with valid credentials', async function () {
  await this.loginAs()
})

Then('I should see the login form', async function () {
  await this.page.waitForSelector('#email', { timeout: 5_000 })
  await this.page.waitForSelector('#password', { timeout: 5_000 })
})

Then('I should see the register form', async function () {
  await this.page.waitForSelector('#username', { timeout: 5_000 })
})

Then('I should see a login error message', async function () {
  await this.page.waitForSelector('.error-message', { timeout: 8_000 })
  const text = await this.page.textContent('.error-message')
  assert.ok(text && text.trim().length > 0, 'Expected an error message to be displayed')
})

Then('I should see the lobby page', async function () {
  await this.page.waitForSelector('.lobby-page', { timeout: 10_000 })
})
