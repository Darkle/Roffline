import os from 'os'
import { chromium } from 'playwright'
import type { BrowserContext, Page } from 'playwright'
import { test as base } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'

let portRef = 9222

const thresholds = {
  performance: 80,
  accessibility: 100,
  'best-practices': 90,
}

export const lighthouseTest = base.extend<
  {
    authenticatedPage: Page
    context: BrowserContext
  },
  {
    port: number
  }
>({
  // We need to assign a unique port for each lighthouse test to allow
  // lighthouse tests to run in parallel
  port: [
    async ({}, use): Promise<void> => {
      portRef = portRef + 1
      await use(portRef)
    },
    { scope: 'worker' },
  ],
  // As lighthouse opens a new page, and as playwright does not by default allow
  // shared contexts, we need to explicitly create a persistent context to
  // allow lighthouse to run behind authenticated routes.
  context: [
    async ({ port }, use): Promise<void> => {
      const userDataDir = os.tmpdir()
      const context = await chromium.launchPersistentContext(userDataDir, {
        args: [`--remote-debugging-port=${port}`],
        headless: true,
      })
      await use(context)
      await context.close()
    },
    { scope: 'test' },
  ],
  authenticatedPage: [
    async ({ context }, use): Promise<void> => {
      context.addCookies([
        {
          name: 'loggedInUser',
          value: process.env['TESTING_DEFAULT_USER'] as string,
          httpOnly: true,
          sameSite: 'Strict',
          domain: `0.0.0.0`,
          path: '/',
        },
      ])

      const page = await context.newPage()

      await use(page)
    },
    { scope: 'test' },
  ],
})

lighthouseTest.describe('Lighthouse checks', () => {
  lighthouseTest('Home page ', async ({ port, authenticatedPage: page }) => {
    await page.goto('/')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('Sub page ', async ({ port, authenticatedPage: page }) => {
    await page.goto('/sub/aww/')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('Settings page ', async ({ port, authenticatedPage: page }) => {
    await page.goto('/settings')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('Sub management page ', async ({ port, authenticatedPage: page }) => {
    await page.goto('/sub-management')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('Search page ', async ({ port, authenticatedPage: page }) => {
    await page.goto('/search')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('Help page ', async ({ port, authenticatedPage: page }) => {
    await page.goto('/help')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('(article link only) post page ', async ({ port, authenticatedPage: page }) => {
    await page.goto('/post/a0a0')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('(cross post) post page ', async ({ port, authenticatedPage: page }) => {
    await page.goto('/post/a0g6')

    await playAudit({
      page,
      port,
      thresholds: {
        ...thresholds,
        // Lighthouse complains about performance cause of all the comments on the page.
        performance: 70,
      },
    })
  })

  lighthouseTest('(image) post page ', async ({ port, authenticatedPage: page }) => {
    await page.goto('/post/a0b1')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('(image gallery) post page', async ({ port, authenticatedPage: page }) => {
    await page.goto('/post/b1b1')

    await playAudit({
      page,
      port,
      thresholds: {
        ...thresholds,
        performance: 79,
      },
    })
  })

  lighthouseTest(
    '(self post question in title no text no link) post page',
    async ({ port, authenticatedPage: page }) => {
      await page.goto('/post/a0c2')

      await playAudit({
        page,
        port,
        thresholds,
      })
    }
  )

  lighthouseTest('(text post link in text) post page', async ({ port, authenticatedPage: page }) => {
    await page.goto('/post/a0d3')

    await playAudit({
      page,
      port,
      thresholds: {
        ...thresholds,
        // Lighthouse complains about performance cause of all the comments on the page.
        performance: 75,
      },
    })
  })

  lighthouseTest('(text post no link) post page', async ({ port, authenticatedPage: page }) => {
    await page.goto('/post/a0e4')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('(video) post page', async ({ port, authenticatedPage: page }) => {
    await page.goto('/post/a0f5')

    await playAudit({
      page,
      port,
      thresholds,
    })
  })

  lighthouseTest('login page', async ({ port, authenticatedPage: page }) => {
    await page.goto('/logout', { waitUntil: 'networkidle' })
    await page.goto('/login', { waitUntil: 'networkidle' })

    await playAudit({
      page,
      port,
      thresholds,
    })
  })
})
