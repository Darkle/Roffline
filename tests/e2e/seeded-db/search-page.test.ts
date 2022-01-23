import { test, expect as pwExpect } from '@playwright/test'
import { expect } from 'chai'

import {
  createLoginCookie,
  resetTestUserSettings,
  showWebPageErrorsInTerminal,
  checkElementExists,
} from '../../test-utils'

test.describe('Search Page', () => {
  test.beforeAll(async () => {
    await resetTestUserSettings()
  })

  test.beforeEach(async ({ context, page }) => {
    showWebPageErrorsInTerminal(page)
    await createLoginCookie(context)
    await page.goto('/search')
  })

  test('validates search page html and text', async ({ page }) => {
    await pwExpect(page).toHaveTitle('Search Roffline')

    const [navHTML, headHTML, mainHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
      document.querySelector('main')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('search-page-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('search-page-nav-menu-html.txt')
    pwExpect(mainHTML).toMatchSnapshot('search-page-main-html.txt')

    await pwExpect(page.locator('nav.pagination')).toHaveCount(0)

    await checkElementExists(page.locator('body>script[src^="/js/search-page.js"]'))
  })

  test('check 0 results html', async ({ page }) => {
    await page.locator('#search-input').fill('sfdsdfadfasfasfsdfsdfsdfsdf')

    await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])

    const mainHTML = await page.evaluate(() => document.querySelector('main')?.outerHTML)

    pwExpect(mainHTML).toMatchSnapshot('search-page-main-0-results-html.txt')

    await pwExpect(page.locator('nav.pagination')).toHaveCount(0)
  })

  test('check results html', async ({ page }) => {
    await page.locator('#search-input').fill('or')

    await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const mainHTML = await page.evaluate(() => document.querySelector('main')?.outerHTML)

    pwExpect(mainHTML).toMatchSnapshot('search-page-main-results-html.txt')

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const mainHTML2 = await page.evaluate(() => document.querySelector('main')?.outerHTML)

    pwExpect(mainHTML2).toMatchSnapshot('search-page-main-results-page-2-html.txt')

    await page.locator('#search-input').fill('or')

    await page.locator('#fuzzySearch').check()

    await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const mainHTML3 = await page.evaluate(() => document.querySelector('main')?.outerHTML)

    pwExpect(mainHTML3).toMatchSnapshot('search-page-main-results-fuzzy-html.txt')
  })

  test('check search form data is correct', async ({ page }) => {
    await page.route('/search?searchTerm*', route => {
      const url = new URL(route.request().url())

      const searchParams = new URLSearchParams(url.search)

      expect(searchParams.get('searchTerm')).to.equal('or')

      route.continue()
    })

    await page.locator('#search-input').fill('or')

    await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])

    await page.unroute('/search?searchTerm*')

    await page.locator('#search-input').fill('or')

    await page.locator('#fuzzySearch').check()

    await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])

    await page.route('/search?searchTerm*', route => {
      const url = new URL(route.request().url())

      const searchParams = new URLSearchParams(url.search)

      expect(searchParams.get('searchTerm')).to.equal('or')

      expect(searchParams.get('fuzzySearch')).to.equal('on')

      route.continue()
    })
  })
})
