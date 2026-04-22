import { Then } from '@cucumber/cucumber'
import assert from 'assert'

Then('I should see a history status message', async function () {
  await this.page.waitForSelector('.history-status, .history-grid', { timeout: 8_000 })
  const status = await this.page.$('.history-status')
  const grid = await this.page.$('.history-grid')
  assert.ok(status || grid, 'Expected either a status message or game cards in history')
})
