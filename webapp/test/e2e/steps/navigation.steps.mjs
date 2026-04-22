import { Given, When, Then } from '@cucumber/cucumber'

Given('I am logged in', async function () {
  await this.loginAs()
})

When('I click the {string} nav link', async function (label) {
  await this.page.getByRole('button', { name: label }).click()
})

When('I click the YOVI logo', async function () {
  await this.page.click('.navbar-title')
})

Then('I should see the game setup page', async function () {
  await this.page.waitForSelector('.setup', { timeout: 5_000 })
})

Then('I should see the history page', async function () {
  await this.page.waitForSelector('.history-page, .history-status', { timeout: 5_000 })
})

Then('I should see the profile page', async function () {
  await this.page.waitForSelector('.profile-page', { timeout: 5_000 })
})
