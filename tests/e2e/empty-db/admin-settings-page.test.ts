import { test, expect as pwExpect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { expect } from 'chai'

import {
  checkElementExists,
  createTestUser,
  deleteTestUser,
  resetAdminSettingsBackToDefault,
  showWebPageErrorsInTerminal,
} from '../../test-utils'

let p = null as null | Page

test.describe('Admin Settings Page', () => {
  test.beforeAll(async () => {
    await createTestUser()
  })

  test.beforeEach(async ({ page, browser }) => {
    showWebPageErrorsInTerminal(page)

    const context = await browser.newContext({
      httpCredentials: { username: 'admin', password: process.env.ADMIN_PASS as string },
    })

    p = await context.newPage()

    await p.goto('/admin/settings', { waitUntil: 'networkidle' })
  })

  test('validates settings page html and text', async () => {
    const page = p as Page

    await pwExpect(page).toHaveTitle('Roffline::Admin::Settings')

    await checkElementExists(page.locator('h1.title:has-text("Roffline Admin")'))

    await checkElementExists(page.locator('body>script[src^="/js/admin/admin-settings-page.js"]'))

    const navHTML = await page.evaluate(() => {
      const navContainer = document.querySelector('nav.admin-menu') as HTMLSpanElement
      return navContainer.outerHTML.replaceAll(/\s\s+/gu, '').replaceAll('\n', ' ')
    })

    pwExpect(navHTML).toMatchSnapshot('admin-settings-page-nav-menu-html.txt')

    const mainElemHTML = await page.evaluate(() => {
      document.querySelector('input[name="csrfToken"]')?.remove()
      const main = document.querySelector('main') as HTMLDivElement
      return main.outerHTML.replaceAll(/\s\s+/gu, '').replaceAll('\n', ' ')
    })

    pwExpect(mainElemHTML).toMatchSnapshot('admin-settings-page-main-elem-html.txt')
  })

  test('should send the correct form data', async () => {
    const page = p as Page

    // eslint-disable-next-line @typescript-eslint/no-misused-promises,complexity
    await page.route('/admin/api/update-admin-setting', async route => {
      const { settingName, settingValue } = route.request().postDataJSON() as {
        settingName: string
        settingValue: boolean
      }
      const csrfHeader = (await route.request().headerValue('csrf-token')) as string

      expect(settingName).to.be.oneOf([
        'downloadComments',
        'numberFeedsOrPostsDownloadsAtOnce',
        'numberMediaDownloadsAtOnce',
        'downloadVideos',
        'videoDownloadMaxFileSize',
        'videoDownloadResolution',
        'updateAllDay',
        'updateStartingHour',
        'updateEndingHour',
      ])

      expect(typeof settingValue).to.be.oneOf(['boolean', 'number', 'string'])

      if (settingName === 'videoDownloadResolution') {
        expect(settingValue).to.be.oneOf(['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'])
      }

      if (settingName === 'updateStartingHour' || settingName === 'updateEndingHour') {
        expect(settingValue).to.be.above(-1)
        expect(settingValue).to.be.below(24)
      }

      if (settingName === 'videoDownloadMaxFileSize') {
        expect(settingValue).to.be.above(49)
      }

      if (settingName === 'numberFeedsOrPostsDownloadsAtOnce' || settingName === 'numberMediaDownloadsAtOnce') {
        expect(settingValue).to.be.above(0)
      }

      expect(csrfHeader).to.not.be.null
      expect(csrfHeader).to.not.be.undefined
      expect(csrfHeader.length).to.be.above(5)

      route.continue()
    })

    await page.locator('#video-download-max-size').isDisabled()
    await page.locator('#update-starting-hour').isDisabled()
    await page.locator('#update-ending-hour').isDisabled()

    await page.click('#enable-comment-downloads')
    await page.waitForLoadState('networkidle')

    await page.click('#enable-video-downloads')
    await page.waitForLoadState('networkidle')

    await page.fill('#video-download-max-size', '550')
    await page.waitForLoadState('networkidle')

    await page.selectOption('#select-video-resolution', '240p')
    await page.waitForLoadState('networkidle')

    await page.selectOption('#select-video-resolution', '360p')
    await page.waitForLoadState('networkidle')

    await page.selectOption('#select-video-resolution', '480p')
    await page.waitForLoadState('networkidle')

    await page.selectOption('#select-video-resolution', '720p')
    await page.waitForLoadState('networkidle')

    await page.selectOption('#select-video-resolution', '1080p')
    await page.waitForLoadState('networkidle')

    await page.selectOption('#select-video-resolution', '1440p')
    await page.waitForLoadState('networkidle')

    await page.selectOption('#select-video-resolution', '2160p')
    await page.waitForLoadState('networkidle')

    await page.fill('#num-feedposts-downloads-at-once', '6')
    await page.waitForLoadState('networkidle')

    await page.fill('#num-downloads-at-once', '4')
    await page.waitForLoadState('networkidle')

    await page.click('#update-all-day')
    await page.waitForLoadState('networkidle')

    await page.fill('#update-starting-hour', '6')
    await page.waitForLoadState('networkidle')

    await page.fill('#update-ending-hour', '10')
    await page.waitForLoadState('networkidle')

    const vidDownMaxSizeDisabled = await page.locator('#video-download-max-size').isDisabled()
    const upStartHourDisabled = await page.locator('#update-starting-hour').isDisabled()
    const upEndHourDisabled = await page.locator('#update-ending-hour').isDisabled()

    expect(vidDownMaxSizeDisabled).to.be.false
    expect(upStartHourDisabled).to.be.false
    expect(upEndHourDisabled).to.be.false

    // reset admin settings back to defaults
    await resetAdminSettingsBackToDefault()
  })

  test.afterAll(async () => {
    await deleteTestUser()
  })
})
