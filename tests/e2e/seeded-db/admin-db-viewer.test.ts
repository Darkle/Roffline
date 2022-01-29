import { test, expect as pwExpect } from '@playwright/test'
import type { Page } from '@playwright/test'
// import { expect } from 'chai'

import { checkElementExists, createTestUser, showWebPageErrorsInTerminal } from '../../test-utils'

let p = null as null | Page

test.describe('Admin DB Viewer Page', () => {
  test.beforeAll(async () => {
    await createTestUser()
  })

  test.beforeEach(async ({ page, browser }) => {
    showWebPageErrorsInTerminal(page)

    const context = await browser.newContext({
      httpCredentials: { username: 'admin', password: process.env['ADMIN_PASS'] as string },
    })

    p = await context.newPage()

    await p.goto('/admin/db-viewer', { waitUntil: 'networkidle' })
  })

  test('validates admin db viewer page html and text', async () => {
    const page = p as Page

    await pwExpect(page).toHaveTitle('Roffline::Admin::DB-Viewer')

    await checkElementExists(page.locator('h1.title:has-text("Roffline Admin")'))

    await checkElementExists(
      page.locator('body>script[src^="/js/admin/admin-db-viewer-page/admin-db-viewer-page.js"]')
    )

    const navHTML = await page.evaluate(() => {
      const navContainer = document.querySelector('nav.admin-menu') as HTMLSpanElement
      return navContainer.outerHTML.replaceAll(/\s\s+/gu, '').replaceAll('\n', ' ')
    })

    pwExpect(navHTML).toMatchSnapshot('admin-db-viewer-page-nav-menu-html.txt')
  })
})
