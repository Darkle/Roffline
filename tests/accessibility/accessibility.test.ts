import { test } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

import { createLoginCookie } from '../test-utils'

test.describe('Accessibility check', () => {
  test.beforeEach(async ({ context }) => {
    await createLoginCookie(context)
  })

  test('Home page ', async ({ page }) => {
    await page.goto('/')

    // This is so axe doesnt think all the titles are the same as we have duplicate titles in the db seeding data
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('article>h2>a')).forEach(elem => {
        // eslint-disable-next-line no-param-reassign
        elem.textContent = `${elem.textContent as string} ${Math.random()}`
      })
    )

    await injectAxe(page)

    await checkA11y(page, undefined, {
      axeOptions: {
        rules: { 'page-has-heading-one': { enabled: false } },
      },
    })
  })

  test('Sub page ', async ({ page }) => {
    await page.goto('/sub/aww/')

    // This is so axe doesnt think all the titles are the same as we have duplicate titles in the db seeding data
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('article>h2>a')).forEach(elem => {
        // eslint-disable-next-line no-param-reassign
        elem.textContent = `${elem.textContent as string} ${Math.random()}`
      })
    )

    await injectAxe(page)

    await checkA11y(page, undefined, {
      axeOptions: {
        rules: { 'page-has-heading-one': { enabled: false } },
      },
    })
  })

  test('Settings page ', async ({ page }) => {
    await page.goto('/settings')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('Sub management page ', async ({ page }) => {
    await page.goto('/sub-management')
    await injectAxe(page)
    await checkA11y(page, undefined, {
      axeOptions: {
        rules: { 'page-has-heading-one': { enabled: false } },
      },
    })
  })

  test('Search page ', async ({ page }) => {
    await page.goto('/search')
    await injectAxe(page)
    await checkA11y(page, undefined, {
      axeOptions: {
        rules: { 'page-has-heading-one': { enabled: false } },
      },
    })
  })

  test('Help page ', async ({ page }) => {
    await page.goto('/help')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('(article link only) post page ', async ({ page }) => {
    await page.goto('/post/a0a0')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('(cross post) post page ', async ({ page }) => {
    await page.goto('/post/a0g6')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('(image) post page ', async ({ page }) => {
    await page.goto('/post/a0b1')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('(image gallery) post page', async ({ page }) => {
    await page.goto('/post/b1b1')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('(self post question in title no text no link) post page', async ({ page }) => {
    await page.goto('/post/a0c2')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('(text post link in text) post page', async ({ page }) => {
    await page.goto('/post/a0d3')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('(text post no link) post page', async ({ page }) => {
    await page.goto('/post/a0e4')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('(video) post page', async ({ page }) => {
    await page.goto('/post/a0f5')
    await injectAxe(page)
    await checkA11y(page)
  })

  test('login page', async ({ page }) => {
    await page.goto('/logout', { waitUntil: 'networkidle' })
    await page.goto('/login', { waitUntil: 'networkidle' })
    await injectAxe(page)
    await checkA11y(page)
  })
})
