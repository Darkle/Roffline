import fs from 'fs'
import { copyFile } from 'fs/promises'
import path from 'path'

import { test, expect as pwExpect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { expect } from 'chai'

import { checkElementExists, createTestUser, showWebPageErrorsInTerminal } from '../../test-utils'

let p = null as null | Page

test.describe('Admin Logs Page', () => {
  test.beforeAll(async () => {
    await createTestUser()
  })

  test.beforeEach(async ({ page, browser }) => {
    showWebPageErrorsInTerminal(page)

    const context = await browser.newContext({
      httpCredentials: { username: 'admin', password: process.env.ADMIN_PASS as string },
    })

    p = await context.newPage()

    await p.goto('/admin/logs-viewer', { waitUntil: 'networkidle' })
  })

  test('validates admin logs page html and text', async () => {
    const page = p as Page

    await pwExpect(page).toHaveTitle('Roffline::Admin::Logs-Viewer')

    await checkElementExists(page.locator('h1.title:has-text("Roffline Admin")'))

    await checkElementExists(page.locator('body>script[src^="/js/admin/admin-logs-viewer-page.js"]'))

    const navHTML = await page.evaluate(() => {
      const navContainer = document.querySelector('nav.admin-menu') as HTMLSpanElement
      // @ts-expect-error replaceAll is available
      return navContainer.outerHTML.replaceAll(/\s\s+/gu, '').replaceAll('\n', ' ')
    })

    pwExpect(navHTML).toMatchSnapshot('admin-logs-page-nav-menu-html.txt')

    await checkElementExists(
      page.locator(
        'main>aside>small:has-text("Note: the logs data is also logged to the browser console for easy inpecting/copying.")'
      )
    )

    await checkElementExists(page.locator('main>.vgt-wrap'))
    await checkElementExists(page.locator('a[class="download-logs-link"][href="/admin/api/download-logs"]'))
  })

  async function fileExists(filePath: string): Promise<boolean> {
    const exists = await fs.promises.stat(filePath).catch(() => {})

    return !!exists
  }

  test.only('download admin logs', async () => {
    const page = p as Page

    const destLogFile1Path = path.join(process.cwd(), 'testing-roffline-logs', '20220115-1021-0-roffline.log')
    const destLogFile2Path = path.join(process.cwd(), 'testing-roffline-logs', '20220115-1116-0-roffline.log')

    const copiedLogFile1Exists = await fileExists(destLogFile1Path)
    const copiedLogFile2Exists = await fileExists(destLogFile2Path)

    if (!copiedLogFile1Exists) {
      await copyFile(
        path.join(process.cwd(), 'tests', 'seed-data', 'logs', '20220115-1021-0-roffline.log'),
        destLogFile1Path
      )
    }
    if (!copiedLogFile2Exists) {
      await copyFile(
        path.join(process.cwd(), 'tests', 'seed-data', 'logs', '20220115-1116-0-roffline.log'),
        destLogFile2Path
      )
    }

    const logFiles = (
      await Promise.all(
        ['20220115-1021-0-roffline.log', '20220115-1116-0-roffline.log'].map(logFileName =>
          fs.promises.readFile(path.join(process.cwd(), 'tests', 'seed-data', 'logs', logFileName), {
            encoding: 'utf8',
          })
        )
      )
    )
      .join('')
      .trim()

    const [download] = await Promise.all([
      page.waitForEvent('download'), // wait for download to start
      await page.click('a.download-logs-link'),
    ])

    const downloadFailed = await download.failure()

    expect(downloadFailed).to.be.null

    const downloadPath = (await download.path()) as string

    const fileText = await fs.promises.readFile(downloadPath, { encoding: 'utf8' })

    expect(fileText.length).to.equal(logFiles.length)
    expect(fileText.length).to.equal(25714)
    expect(logFiles.length).to.equal(25714)
  })
})
