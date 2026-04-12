import { setWorldConstructor, Before, After, setDefaultTimeout } from '@cucumber/cucumber'
import { chromium } from 'playwright'

setDefaultTimeout(60_000)

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const E2E_EMAIL = process.env.E2E_EMAIL ?? 'test@yovi.com'
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? ''

class CustomWorld {
  browser = null
  page = null

  baseUrl() {
    return BASE_URL
  }

  async loginAs(email = E2E_EMAIL, password = E2E_PASSWORD) {
    const page = this.page
    await page.goto(BASE_URL)
    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.click('.submit-button')
    await page.waitForSelector('.navbar', { timeout: 10_000 })
  }
}

setWorldConstructor(CustomWorld)

Before(async function () {
  const headless = process.env.E2E_HEADLESS !== 'false'
  const slowMo = Number(process.env.E2E_SLOW_MO ?? 0)

  this.browser = await chromium.launch({ headless, slowMo })
  this.page = await this.browser.newPage()
})

After(async function () {
  if (this.page) await this.page.close()
  if (this.browser) await this.browser.close()
})
