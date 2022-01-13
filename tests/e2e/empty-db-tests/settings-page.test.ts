import fs from 'fs'
import path from 'path'

import { test, expect as pwExpect } from '@playwright/test'
import { expect } from 'chai'

import {
  createLoginCookie,
  createTestUser,
  deleteTestUser,
  checkElementExists,
  showWebPageErrorsInTerminal,
  removeAllSubreddits,
} from '../../test-utils'

test.describe('Settings Page', () => {
  test.beforeAll(async () => {
    await createTestUser()
  })

  test.beforeEach(async ({ context, page }) => {
    await createLoginCookie(context)
    await page.goto('/settings')
  })

  test('validates settings page html and text', async ({ page }) => {
    /*****
    We are purposely erroring in one of our tests below, so we need to manually inlcude
    showWebPageErrorsInTerminal for each test instead of in beforeEach. That way we can
    exclude it from the test that will have a failure in it.
    *****/
    showWebPageErrorsInTerminal(page)

    await pwExpect(page).toHaveTitle('Roffline Settings')

    // Top filter shouldnt show on settings page
    await pwExpect(page.locator('summary:has-text("Top")')).toHaveCount(0)

    await checkElementExists(page.locator('a:has-text("Home")'))
    await checkElementExists(page.locator('a:has-text("Search")'))
    await checkElementExists(page.locator('a:has-text("Settings")').first())
    await checkElementExists(page.locator('a:has-text("Help")'))
    await checkElementExists(page.locator('summary:has-text("Subreddits")'))
    await checkElementExists(page.locator('details.subs-dropdown a:has-text("All")'))
    await checkElementExists(page.locator('details.subs-dropdown a[href="/"]'))
    await checkElementExists(page.locator('details.subs-dropdown a:has-text("Manage")'))
    await checkElementExists(page.locator('details.subs-dropdown a[href="/sub-management"]'))

    const homeNavLink = await page.getAttribute('a:has-text("Home")', 'href')
    const searchNavLink = await page.getAttribute('a:has-text("Search")', 'href')
    const settingsNavLink = await page.getAttribute('a:has-text("Settings")', 'href')
    const helpNavLink = await page.getAttribute('a:has-text("Help")', 'href')
    const allSubsNavLink = await page.getAttribute('details.subs-dropdown a:has-text("All")', 'href')
    const manageSubsNavLink = await page.getAttribute('details.subs-dropdown a:has-text("Manage")', 'href')

    expect(homeNavLink).to.equal('/')
    expect(searchNavLink).to.equal('/search')
    expect(settingsNavLink).to.equal('/settings')
    expect(helpNavLink).to.equal('/help')
    expect(allSubsNavLink).to.equal('/')
    expect(manageSubsNavLink).to.equal('/sub-management')

    await checkElementExists(
      page.locator(`h1:has-text("${process.env.TESTING_DEFAULT_USER as string}'s settings")`)
    )

    await checkElementExists(page.locator(`form[method="post"]`))
    await checkElementExists(page.locator('form input[name="csrfToken"]'))
    const loginFormCsrfInput = await page.getAttribute('form input[name="csrfToken"]', 'value')

    expect(loginFormCsrfInput).to.have.lengthOf.above(5)

    await checkElementExists(page.locator('fieldset legend:has-text("Display")'))

    await checkElementExists(page.locator('label:has-text("Hide Stickied Posts")'))
    await checkElementExists(page.locator('label:has-text("Only Show Titles In Feed")'))
    await checkElementExists(page.locator('label:has-text("Infinite Scroll")'))
    await checkElementExists(page.locator('label:has-text("Dark Theme")'))
    await checkElementExists(page.locator('label input[type="checkbox"][data-setting-name="hideStickiedPosts"]'))
    await checkElementExists(
      page.locator('label input[type="checkbox"][data-setting-name="onlyShowTitlesInFeed"]')
    )
    await checkElementExists(page.locator('label input[type="checkbox"][data-setting-name="infiniteScroll"]'))
    await checkElementExists(page.locator('label input[type="checkbox"][data-setting-name="darkModeTheme"]'))

    await checkElementExists(page.locator('fieldset legend:has-text("Subs")'))
    await checkElementExists(page.locator('label[for="bulk-importer-textarea"]'))
    await pwExpect(page.locator('label[for="bulk-importer-textarea"]')).toHaveText('Bulk Subreddit Importer')
    await checkElementExists(page.locator('textarea[placeholder="Enter space seperated subreddits"]'))
    await checkElementExists(page.locator('button:has-text("Import Subs")'))
    await checkElementExists(
      page.locator(
        'a[href="/help#bulk-import-reddit-subs"]:has-text("How Do I Bulk Import My Reddit Subscriptions?")'
      )
    )
    await checkElementExists(page.locator('a[href="/api/export-user-subs"]:has-text("Export Subs")'))
    await checkElementExists(page.locator('a[href="/logout"]:has-text("Logout")'))
    await checkElementExists(page.locator('a[href="/admin/"][target="_blank"]:has-text("Open Admin Page")'))

    await checkElementExists(page.locator('body>script[src^="/js/settings-page.js"]'))
  })

  test('importing subs works and shows success error messages', async ({ page, context }) => {
    await page.fill('#bulk-importer-textarea', 'aww dogs\ncats')

    await page.click('button:has-text("Import Subs")')

    await pwExpect(page.locator('button:has-text("Import Subs")')).toBeDisabled()
    await pwExpect(page.locator('#bulk-importer-textarea')).toBeDisabled()
    await pwExpect(page.locator('.importing-subs-success-message')).toBeVisible()
    const errorMessage1 = await page.isVisible('.importing-subs-error')

    expect(errorMessage1).to.be.false

    await page.locator('.importing-subs-success-message').waitFor({ state: 'hidden' })

    await page.fill(
      '#bulk-importer-textarea',
      'https://www.reddit.com/r/90sAltRockRevival+AbruptChaos+AccidentalWesAnderson+AdviceAnimals+alphaandbetausers+alpinejs+americandad+androidafterlife+androidapps+AnimalsBeingDerps+AnimalsBeingFunny+AnimalsBeingHappy'
    )

    await page.click('button:has-text("Import Subs")')

    await pwExpect(page.locator('button:has-text("Import Subs")')).toBeDisabled()
    await pwExpect(page.locator('#bulk-importer-textarea')).toBeDisabled()
    await pwExpect(page.locator('.importing-subs-success-message')).toBeVisible()
    const errorMessage2 = await page.isVisible('.importing-subs-error')

    expect(errorMessage2).to.be.false

    await page.locator('.importing-subs-success-message').waitFor({ state: 'hidden' })

    await page.fill('#bulk-importer-textarea', 'cars pics')

    await page.press('button:has-text("Import Subs")', 'Enter')

    await pwExpect(page.locator('button:has-text("Import Subs")')).toBeDisabled()
    await pwExpect(page.locator('#bulk-importer-textarea')).toBeDisabled()
    await pwExpect(page.locator('.importing-subs-success-message')).toBeVisible()
    const errorMessage3 = await page.isVisible('.importing-subs-error')

    expect(errorMessage3).to.be.false

    await page.locator('.importing-subs-success-message').waitFor({ state: 'hidden' })

    await context.route('/api/bulk-import-user-subs', route => {
      route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'Merp Error',
      })
    })

    await page.fill('#bulk-importer-textarea', 'soccer')

    await page.click('button:has-text("Import Subs")')

    await page.waitForLoadState('networkidle')

    await pwExpect(page.locator('.importing-subs-error')).toBeVisible()
    const errorMessage5 = await page.isVisible('.importing-subs-success-message')

    expect(errorMessage5).to.be.false

    const content = (await page.textContent('.importing-subs-error-message')) as string

    expect(content).to.match(/^Error importing subs: /u)
    expect(content.length).to.be.above(22)
  })

  test('exporting subs works', async ({ page }) => {
    /*****
    We are purposely erroring in one of our tests below, so we need to manually inlcude
    showWebPageErrorsInTerminal for each test instead of in beforeEach. That way we can
    exclude it from the test that will have a failure in it.
    *****/
    showWebPageErrorsInTerminal(page)

    await page.fill(
      '#bulk-importer-textarea',
      'AbruptChaos AccidentalWesAnderson AdviceAnimals alphaandbetausers alpinejs'
    )

    await page.click('button:has-text("Import Subs")')

    await page.waitForLoadState('networkidle')

    const [download] = await Promise.all([
      page.waitForEvent('download'), // wait for download to start
      await page.click('a[href="/api/export-user-subs"]:has-text("Export Subs")'),
    ])

    const downloadFailed = await download.failure()

    expect(downloadFailed).to.be.null

    const downloadPath = (await download.path()) as string

    const fileText = await fs.promises.readFile(path.join(downloadPath), { encoding: 'utf8' })

    expect(fileText).to.contain('abruptchaos accidentalwesanderson adviceanimals alphaandbetausers alpinejs')
  })

  test('should send the correct form data on importing subs and changing settings', async ({ page, context }) => {
    /*****
    We are purposely erroring in one of our tests below, so we need to manually inlcude
    showWebPageErrorsInTerminal for each test instead of in beforeEach. That way we can
    exclude it from the test that will have a failure in it.
    *****/
    showWebPageErrorsInTerminal(page)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await context.route('/api/bulk-import-user-subs', async route => {
      const postJSON = route.request().postDataJSON() as { subToAdd: string }
      const csrfHeader = (await route.request().headerValue('csrf-token')) as string

      expect(postJSON).to.have.deep.property('subsToImport', ['news', 'trees', 'ships'])
      expect(csrfHeader).to.not.be.null
      expect(csrfHeader).to.not.be.undefined
      expect(csrfHeader.length).to.be.above(5)

      route.continue()
    })

    await page.fill('#bulk-importer-textarea', 'news trees ships')

    await page.click('button:has-text("Import Subs")')

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await context.route('/api/update-user-setting', async route => {
      const { settingName, settingValue } = route.request().postDataJSON() as {
        settingName: string
        settingValue: boolean
      }
      const csrfHeader = (await route.request().headerValue('csrf-token')) as string

      expect(settingName).to.be.oneOf([
        'hideStickiedPosts',
        'onlyShowTitlesInFeed',
        'infiniteScroll',
        'darkModeTheme',
      ])

      expect(settingValue).to.be.oneOf([true, false])

      expect(csrfHeader).to.not.be.null
      expect(csrfHeader).to.not.be.undefined
      expect(csrfHeader.length).to.be.above(5)

      route.continue()
    })

    await page.click('input[data-setting-name="hideStickiedPosts"]')
    await page.waitForLoadState('networkidle')

    await page.click('input[data-setting-name="onlyShowTitlesInFeed"]')
    await page.waitForLoadState('networkidle')

    await page.click('input[data-setting-name="infiniteScroll"]')
    await page.waitForLoadState('networkidle')

    await page.click('input[data-setting-name="darkModeTheme"]')
    await page.waitForLoadState('networkidle')
  })

  test('changing dark theme adds/removes dark theme class', async ({ page }) => {
    /*****
    We are purposely erroring in one of our tests below, so we need to manually inlcude
    showWebPageErrorsInTerminal for each test instead of in beforeEach. That way we can
    exclude it from the test that will have a failure in it.
    *****/
    showWebPageErrorsInTerminal(page)

    // Reset the darkmode setting in case another test changed it.
    const darkModeEnabled = await page.locator('input[data-setting-name="darkModeTheme"]').isChecked()

    if (darkModeEnabled) {
      await page.click('input[data-setting-name="darkModeTheme"]')
    }

    await page.goto('/settings')

    await pwExpect(page.locator('body')).toHaveClass('settings-page ')

    await page.click('input[data-setting-name="darkModeTheme"]')

    await pwExpect(page.locator('body')).toHaveClass('settings-page dark-theme')

    await page.goto('/settings')

    await pwExpect(page.locator('body')).toHaveClass('settings-page dark-theme')
  })

  test.afterAll(async () => {
    // Delete everything we created
    await removeAllSubreddits()
    await deleteTestUser()
  })
})
