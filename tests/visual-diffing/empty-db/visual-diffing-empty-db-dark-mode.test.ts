import { test, expect as pwExpect } from '@playwright/test'

import {
  createLoginCookie,
  createTestUser,
  deleteTestUser,
  DB,
  showWebPageErrorsInTerminal,
  waitForTextRendering,
} from '../../test-utils'

test.describe('Visual Diffing All Pages (empty db)(dark mode enabled)', () => {
  test.beforeAll(async () => {
    await createTestUser()
    await DB.run(
      `UPDATE users SET darkModeTheme = true where name = '${process.env.TESTING_DEFAULT_USER as string}'`
    )
  })

  test.beforeEach(async ({ context, page }) => {
    showWebPageErrorsInTerminal(page)
    await createLoginCookie(context)
  })

  // Dont need to check the login page for dark mode as that is always white.

  test('Home Page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('home-page-dark-mode.png')

    await page.goto('/sub-management', { waitUntil: 'networkidle' })
    await page.fill('input[name="subToAdd"]', 'aww')
    await page.click('input[type="submit"]')
    await page.waitForLoadState('networkidle')

    // Gotta wait for the db to catch up for some reason
    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(500)

    await page.goto('/', { waitUntil: 'networkidle' })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('home-page-subs-added-but-not-yet-retrieved-dark-mode.png')

    await page.click('.subs-dropdown summary')
    await page.click('.top-filter summary')

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('home-page-dropdowns-dark-mode.png')
  })

  test('Settings Page', async ({ page, viewport }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' })

    await page.setViewportSize({ width: viewport?.width as number, height: 1400 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('settings-page-dark-mode.png')
  })

  test('Search Page', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'networkidle' })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('search-page-dark-mode.png')

    await page.fill('#search-input', 'asd')

    await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])

    pwExpect(await page.screenshot()).toMatchSnapshot('search-page-0-results-dark-mode.png')
  })

  test('Help Page', async ({ page, viewport }) => {
    await page.goto('/help', { waitUntil: 'networkidle' })

    await page.setViewportSize({ width: viewport?.width as number, height: 1800 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('help-page-dark-mode.png')
  })

  test.afterAll(async () => {
    await deleteTestUser()
  })
})
