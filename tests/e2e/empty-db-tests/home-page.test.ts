import { test, expect as pwExpect } from '@playwright/test'
import { expect } from 'chai'
import Prray from 'prray'

import {
  createLoginCookie,
  createTestUser,
  deleteTestUser,
  checkElementExists,
  showWebPageErrorsInTerminal,
} from '../../test-utils'

test.describe('Home Page', () => {
  test.beforeAll(async () => {
    await createTestUser()
  })

  test.beforeEach(async ({ context, page }) => {
    showWebPageErrorsInTerminal(page)
    await createLoginCookie(context)
    await page.goto('/')
  })

  test('validates home page look and html', async ({ page }) => {
    await pwExpect(page).toHaveTitle('Roffline Home Page')
    await checkElementExists(page.locator('a:has-text("Home")'))
    await checkElementExists(page.locator('a:has-text("Search")'))
    await checkElementExists(page.locator('a:has-text("Settings")').first())
    await checkElementExists(page.locator('a:has-text("Help")'))
    await checkElementExists(page.locator('summary:has-text("Subreddits")'))
    await checkElementExists(page.locator('details.subs-dropdown a:has-text("All")'))
    await checkElementExists(page.locator('details.subs-dropdown a[href="/"]'))
    await checkElementExists(page.locator('details.subs-dropdown a:has-text("Manage")'))
    await checkElementExists(page.locator('details.subs-dropdown a[href="/sub-management"]'))
    await checkElementExists(page.locator('summary:has-text("Top")'))
    await checkElementExists(page.locator('.top-filter a:has-text("Today")'))
    await checkElementExists(page.locator('.top-filter a[href="?topFilter=day"]'))
    await checkElementExists(page.locator('.top-filter a:has-text("Week")'))
    await checkElementExists(page.locator('.top-filter a[href="?topFilter=week"]'))
    await checkElementExists(page.locator('.top-filter a:has-text("Month")'))
    await checkElementExists(page.locator('.top-filter a[href="?topFilter=month"]'))
    await checkElementExists(page.locator('.top-filter a:has-text("Year")'))
    await checkElementExists(page.locator('.top-filter a[href="?topFilter=year"]'))
    await checkElementExists(page.locator('.top-filter a:has-text("All Time")'))
    await checkElementExists(page.locator('.top-filter a[href="?topFilter=all"]'))

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

    // May as well check some of the stuf in the <head> too
    await checkElementExists(page.locator('head>meta[charset="utf-8"]'))
    await checkElementExists(
      page.locator('head>meta[name="viewport"][content="width=device-width, initial-scale=1, shrink-to-fit=no"]')
    )
    await checkElementExists(page.locator('head>meta[name="referrer"][content="no-referrer"]'))
    await checkElementExists(page.locator('head>link[rel="icon"][href="/static/images/favicon.png"]'))
    await checkElementExists(
      page.locator('head>link[rel="stylesheet"][href^="/static/vendor/css/modern-normalize"]')
    )
    await checkElementExists(page.locator('head>link[rel="stylesheet"][href^="/static/vendor/css/chota"]'))
    await checkElementExists(page.locator('head>link[rel="stylesheet"][href^="/static/vendor/css/splide"]'))
    await checkElementExists(page.locator('head>link[rel="stylesheet"][href^="/css/index.css"]'))
    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))
  })

  test('All the links in nav go to the right places', async ({ page }) => {
    await Prray.from([
      { elemQuery: 'a:has-text("Home")', pathname: '/' },
      { elemQuery: 'a:has-text("Search")', pathname: '/search' },
      { elemQuery: 'a:has-text("Settings")', pathname: '/settings' },
      { elemQuery: 'a:has-text("Help")', pathname: '/help' },
      { elemQuery: 'details.subs-dropdown a:has-text("All")', pathname: '/' },
      { elemQuery: 'details.subs-dropdown a:has-text("Manage")', pathname: '/sub-management' },
      { elemQuery: '.top-filter a:has-text("Today")', search: '?topFilter=day' },
      { elemQuery: '.top-filter a:has-text("Week")', search: '?topFilter=week' },
      { elemQuery: '.top-filter a:has-text("Month")', search: '?topFilter=month' },
      { elemQuery: '.top-filter a:has-text("Year")', search: '?topFilter=year' },
      { elemQuery: '.top-filter a:has-text("All Time")', search: '?topFilter=all' },
    ]).forEachAsync(
      async ({ elemQuery, pathname, search }) => {
        await page.goto('/')

        await page.click('.subs-dropdown')
        await page.click('.top-filter')

        await page.click(elemQuery)

        const pageURL = new URL(page.url())

        // eslint-disable-next-line chai-friendly/no-unused-expressions
        pathname ? expect(pageURL.pathname).to.equal(pathname) : expect(pageURL.search).to.equal(search)
      },
      { concurrency: 1 }
    )
  })

  test('show welcome screen when user has no subs', async ({ page }) => {
    await checkElementExists(page.locator('#roffline-logo'))
    await checkElementExists(page.locator('h1:has-text("Welcome To Roffline (Reddit; Offline)")'))
    await checkElementExists(
      page.locator('.welcome p:has-text("To get started, add a subreddit on the sub-management page.")')
    )
    await checkElementExists(
      page.locator('.welcome p:has-text("Alternatively, you can bulk import subreddits from the settings page.")')
    )
    await checkElementExists(page.locator('.welcome a:has-text("sub-management")'))
    await checkElementExists(page.locator('.welcome a[href="/sub-management"]:has-text("sub-management")'))
    await checkElementExists(page.locator('.welcome a:has-text("settings")'))
    await checkElementExists(page.locator('.welcome a[href="/settings"]:has-text("settings")'))
  })

  test('show the downloading posts message when user has 1 or more subs', async ({ page }) => {
    await page.goto('/sub-management')
    await page.fill('input[name="subToAdd"]', 'aww')
    await page.click('input[type="submit"]')
    await page.waitForLoadState('networkidle')
    await page.goto('/')
    await checkElementExists(page.locator('.no-posts-found-message'))
    await checkElementExists(page.locator('p:has-text("No posts found.")'))
    await checkElementExists(
      page.locator(
        'p:has-text("If you have recently added a subreddit, it may take a moment for posts to show up.")'
      )
    )
  })

  test('check new sub shows up in subs menu', async ({ page }) => {
    await page.goto('/sub-management')
    await page.fill('input[name="subToAdd"]', 'aww')
    await page.click('input[type="submit"]')
    await page.waitForLoadState('networkidle')
    await page.goto('/')
    await checkElementExists(page.locator('.subs-dropdown a[href="/sub/aww"]:has-text("aww")'))
  })

  test.afterAll(async () => {
    await deleteTestUser()
  })
})
