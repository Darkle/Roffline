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
} from '../../test-utils'

const { version: appVersion } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), { encoding: 'utf8' })
) as Record<string, unknown>

test.describe('Help Page', () => {
  test.beforeAll(async () => {
    await createTestUser()
  })

  test.beforeEach(async ({ context, page }) => {
    showWebPageErrorsInTerminal(page)
    await createLoginCookie(context)
    await page.goto('/help')
  })

  test('validates Help page html and text', async ({ page }) => {
    await pwExpect(page).toHaveTitle('Roffline Help')
    await checkElementExists(page.locator('nav a:has-text("Home")'))
    await checkElementExists(page.locator('nav a:has-text("Search")'))
    await checkElementExists(page.locator('nav a:has-text("Settings")').first())
    await checkElementExists(page.locator('nav a:has-text("Help")'))
    await checkElementExists(page.locator('nav summary:has-text("Subreddits")'))
    await checkElementExists(page.locator('nav details.subs-dropdown a:has-text("All")'))
    await checkElementExists(page.locator('nav details.subs-dropdown a[href="/"]'))
    await checkElementExists(page.locator('nav details.subs-dropdown a:has-text("Manage")'))
    await checkElementExists(page.locator('nav details.subs-dropdown a[href="/sub-management"]'))

    const homeNavLink = await page.getAttribute('nav a:has-text("Home")', 'href')
    const searchNavLink = await page.getAttribute('nav a:has-text("Search")', 'href')
    const settingsNavLink = await page.getAttribute('nav a:has-text("Settings")', 'href')
    const helpNavLink = await page.getAttribute('nav a:has-text("Help")', 'href')
    const allSubsNavLink = await page.getAttribute('details.subs-dropdown a:has-text("All")', 'href')
    const manageSubsNavLink = await page.getAttribute('details.subs-dropdown a:has-text("Manage")', 'href')

    // Top filter shouldnt show on help page
    await pwExpect(page.locator('nav summary:has-text("Top")')).toHaveCount(0)

    expect(homeNavLink).to.equal('/')
    expect(searchNavLink).to.equal('/search')
    expect(settingsNavLink).to.equal('/settings')
    expect(helpNavLink).to.equal('/help')
    expect(allSubsNavLink).to.equal('/')
    expect(manageSubsNavLink).to.equal('/sub-management')

    await checkElementExists(page.locator('#roffline-logo'))
    await checkElementExists(page.locator('h1:has-text("Roffline")'))

    const versionSpan = (await page.textContent('.roffline-logotitle span'))?.trim() as string

    expect(versionSpan).to.equal(appVersion)

    await checkElementExists(
      page.locator(
        'p a[href="https://github.com/Darkle/Roffline"][target="_blank"][rel="noopener"]:has-text("Offical Roffline Home Page")'
      )
    )
    await checkElementExists(
      page.locator(
        'p a[href="https://github.com/Darkle/Roffline/issues"][target="_blank"][rel="noopener"]:has-text("Support/Issues")'
      )
    )
    await checkElementExists(
      page.locator(
        'p a[href="https://www.buymeacoffee.com/2yhzJxd4B"][target="_blank"][rel="noopener"]:has-text("Donate Via Buy Me a Coffee")'
      )
    )
    await checkElementExists(page.locator('.bitcoin-donation>span:has-text("Donate via Bitcoin: ")'))

    const content = (await page.textContent('.bitcoin-donation>pre')) as string
    expect(content.trim().length).to.equal(34)

    await checkElementExists(page.locator('h2:has-text("FAQ")'))
    await checkElementExists(page.locator('.faq h3:has-text("How To Bulk Import Your Reddit Subscriptions")'))
    await checkElementExists(page.locator('.faq ol>li:has-text("Log in to reddit in a browser")'))

    const content2 = (await page.textContent('.faq ol>li:nth-of-type(2)')) as string

    // @ts-expect-error replaceAll is available
    expect(content2.trim().replaceAll(/\s\s+/gu, ' ').replaceAll('\n', ' ')).to.equal(
      'Go to the https://www.reddit.com/subreddits/mine page'
    )

    await checkElementExists(
      page.locator(
        `.faq ol>li:has-text('Right-click on the link on the right of the page that says "multireddit of your subscriptions"')`
      )
    )
    await checkElementExists(page.locator('.faq ol>li>p:has-text("It should look like this:")'))
    await checkElementExists(
      page.locator(
        '.faq ol>li>p>img[src="/static/images/multireddit-screenshot.png"][alt="Screenshot Of Multireddit Link"]'
      )
    )
    await checkElementExists(page.locator('.faq ol>li:has-text("Go to the Roffline settings page here:")'))
    await checkElementExists(page.locator('.faq ol>li>a[href="/settings"]:has-text("Settings")'))
    await checkElementExists(
      page.locator(`.faq ol>li:has-text('Paste the link into the "Bulk Subreddit Importer" section')`)
    )
    await checkElementExists(page.locator(`.faq ol>li:has-text('Click the "Import Subs" button')`))

    await checkElementExists(page.locator('body>script[src^="/js/help-page.js"]'))
  })

  test.afterAll(async () => {
    await deleteTestUser()
  })
})
