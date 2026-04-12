import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('I navigate to the Play page', async function () {
  await this.page.getByRole('button', { name: 'Play' }).click()
  await this.page.waitForSelector('.setup', { timeout: 5_000 })
})

When('I click the start game button', async function () {
  await this.page.click('.setup__play-btn')
})

When('I select board size {int}', async function (size) {
  await this.page.click(`.setup__size-btn:has-text("${size}")`)
})

When('I select difficulty {string}', async function (difficulty) {
  await this.page.locator('.setup__diff-btn').filter({ hasText: new RegExp(difficulty, 'i') }).click()
})

Then('I should see the game board', async function () {
  await this.page.waitForSelector('.game-page', { timeout: 10_000 })
})

Then('I should see at least one hex cell on the board', async function () {
  await this.page.waitForSelector('.hex-cell', { timeout: 10_000 })
  const cells = await this.page.$$('.hex-cell')
  assert.ok(cells.length > 0, `Expected at least one hex cell, found ${cells.length}`)
})
