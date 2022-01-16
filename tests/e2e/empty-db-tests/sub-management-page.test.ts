import { test, expect as pwExpect } from '@playwright/test'
import type { Dialog } from '@playwright/test'
import { expect } from 'chai'

import {
  createLoginCookie,
  createTestUser,
  deleteTestUser,
  checkElementExists,
  showWebPageErrorsInTerminal,
} from '../../test-utils'

test.describe('Sub Management Page', () => {
  test.beforeAll(async () => {
    await createTestUser()
  })

  test.beforeEach(async ({ context, page }) => {
    showWebPageErrorsInTerminal(page)
    await createLoginCookie(context)
    await page.goto('/sub-management')
  })

  test('validates sub management html and text', async ({ page }) => {
    await pwExpect(page).toHaveTitle('Roffline - Subreddit Management')
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

    // Top filter shouldnt show on sub management page
    await pwExpect(page.locator('summary:has-text("Top")')).toHaveCount(0)

    expect(homeNavLink).to.equal('/')
    expect(searchNavLink).to.equal('/search')
    expect(settingsNavLink).to.equal('/settings')
    expect(helpNavLink).to.equal('/help')
    expect(allSubsNavLink).to.equal('/')
    expect(manageSubsNavLink).to.equal('/sub-management')

    await checkElementExists(page.locator('form label:has-text("Add Subreddit")'))
    await checkElementExists(page.locator('form[action="/api/add-user-subreddit"][method="post"]'))
    await checkElementExists(
      page.locator(
        'form[action="/api/add-user-subreddit"][method="post"] input[type="text"][name="subToAdd"][placeholder="Add Subreddit"]'
      )
    )
    await checkElementExists(
      page.locator('form[action="/api/add-user-subreddit"][method="post"] input[type="submit"][value="Submit"]')
    )

    await checkElementExists(page.locator('form[action="/api/remove-user-subreddit"][method="post"]'))
    await checkElementExists(page.locator('form h5:has-text("Remove Subreddit")'))

    await checkElementExists(page.locator('body>script[src^="/js/sub-management-page.js"]'))

    const visible = await page.isVisible('.success-adding-subreddit-message')
    expect(visible).to.be.false
  })

  test('adding and removing sub works', async ({ page }) => {
    await pwExpect(page.locator('p[data-menu-subreddit="aww"] > a[href="/sub/aww"]')).toHaveCount(0)

    const visible1 = await page.isVisible('.success-adding-subreddit-message')
    expect(visible1).to.be.false

    await page.fill('input[name="subToAdd"]', 'aww')
    await page.click('input[type="submit"]')
    await page.waitForLoadState('networkidle')

    const visible2 = await page.isVisible('.success-adding-subreddit-message')
    expect(visible2).to.be.true

    const addSuccessMessage = (await page.textContent('.success-adding-subreddit-message'))?.trim() as string

    expect(addSuccessMessage).to.equal('aww subreddit added')

    await checkElementExists(page.locator('p[data-menu-subreddit="aww"] > a[href="/sub/aww"]'))

    await checkElementExists(page.locator('.subs-dropdown a[href="/sub/aww"]:has-text("aww")'))

    await page.locator('.success-adding-subreddit-message').waitFor({ state: 'hidden' })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    page.on('dialog', (dialog: Dialog): Promise<void> => dialog.accept())

    await page.click('.sub-removal-container .sub-container:has-text("aww")')

    await page.waitForLoadState('networkidle')

    await pwExpect(page.locator('.subs-dropdown a[href="/sub/aww"]:has-text("aww")')).toHaveCount(0)

    await page.locator('.success-removing-subreddit-message').waitFor({ state: 'visible' })

    const visible3 = await page.isVisible('.success-removing-subreddit-message')
    expect(visible3).to.be.true

    const removeSuccessMessage = (await page.textContent('.success-removing-subreddit-message'))?.trim() as string

    expect(removeSuccessMessage).to.equal('aww subreddit removed')

    await pwExpect(page.locator('p[data-menu-subreddit="aww"] > a[href="/sub/aww"]')).toHaveCount(0)

    await page.locator('.success-removing-subreddit-message').waitFor({ state: 'hidden' })

    await page.fill('input[name="subToAdd"]', 'aww')

    await page.press('form[action="/api/add-user-subreddit"][method="post"] input[type="submit"]', 'Enter')

    await page.waitForLoadState('networkidle')

    await page.locator('.success-adding-subreddit-message').waitFor({ state: 'visible' })

    const visible4 = await page.isVisible('.success-adding-subreddit-message')

    expect(visible4).to.be.true

    const addSuccessMessage2 = (await page.textContent('.success-adding-subreddit-message'))?.trim() as string

    expect(addSuccessMessage2).to.equal('aww subreddit added')

    await checkElementExists(page.locator('p[data-menu-subreddit="aww"] > a[href="/sub/aww"]'))

    await page.goto('/sub-management')

    await checkElementExists(page.locator('p[data-menu-subreddit="aww"] > a[href="/sub/aww"]'))

    await checkElementExists(page.locator('div[data-sub-to-remove="aww"]'))

    // Remove sub at end
    await page.click('div[data-sub-to-remove="aww"]')
  })

  test('should send the correct form data on submit', async ({ page }) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await page.route('/api/add-user-subreddit', async route => {
      const postJSON = route.request().postDataJSON() as { subToAdd: string }
      const csrfHeader = (await route.request().headerValue('csrf-token')) as string

      expect(postJSON).to.have.property('subToAdd', 'aww')
      expect(csrfHeader).to.not.be.null
      expect(csrfHeader).to.not.be.undefined
      expect(csrfHeader.length).to.be.above(5)

      route.continue()
    })

    await page.fill('input[name="subToAdd"]', 'aww')
    await page.click('input[type="submit"]')
    await page.waitForLoadState('networkidle')

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await page.route('/api/remove-user-subreddit', async route => {
      const postJSON = route.request().postDataJSON() as { subToAdd: string }
      const csrfHeader = (await route.request().headerValue('csrf-token')) as string

      expect(postJSON).to.have.property('subToRemove', 'aww')
      expect(csrfHeader).to.not.be.null
      expect(csrfHeader).to.not.be.undefined
      expect(csrfHeader.length).to.be.above(5)

      route.continue()
    })

    await page.click('.sub-removal-container .sub-container:has-text("aww")')
  })

  test.afterAll(async () => {
    await deleteTestUser()
  })
})
