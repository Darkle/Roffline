import { test, expect as pwExpect } from '@playwright/test'

import {
  createLoginCookie,
  createTestUser,
  resetTestUserSettings,
  showWebPageErrorsInTerminal,
  waitForTextRendering,
  DB,
} from '../../test-utils'

test.describe('Visual Diffing All Pages (seeded db)', () => {
  test.beforeAll(async () => {
    await createTestUser()
  })

  test.beforeEach(async ({ context, page }) => {
    showWebPageErrorsInTerminal(page)
    await resetTestUserSettings()
    await DB.run(
      `UPDATE users SET darkModeTheme = true where name = '${process.env['TESTING_DEFAULT_USER'] as string}'`
    )
    await createLoginCookie(context)
  })

  test('Home Page', async ({ page, viewport, isMobile }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: 4500 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('home-page-first-7-posts.png')

    await page.setViewportSize({ width: viewport?.width as number, height: isMobile ? 1400 : 1100 })

    await waitForTextRendering(page)

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    pwExpect(await page.screenshot()).toMatchSnapshot('home-page-nav.png')

    // page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: 4500 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('home-page-first-7-posts-2.png')

    await page.setViewportSize({ width: viewport?.width as number, height: isMobile ? 1400 : 1100 })

    await waitForTextRendering(page)

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    pwExpect(await page.screenshot()).toMatchSnapshot('home-page-nav-2.png')
  })

  test('Home Page: only show titles in feed', async ({ page, viewport, isMobile }) => {
    await page.goto('/settings')

    const onlyTitlesEnabled = await page.locator('input[data-setting-name="onlyShowTitlesInFeed"]').isChecked()

    if (!onlyTitlesEnabled) {
      await page.click('input[data-setting-name="onlyShowTitlesInFeed"]')
    }

    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(1000)

    await page.goto('/', { waitUntil: 'networkidle' })

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: isMobile ? 2700 : 2100 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('home-page-first-7-posts-only-titles.png')

    // page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await waitForTextRendering(page)

    await page.setViewportSize({ width: viewport?.width as number, height: isMobile ? 2700 : 2100 })

    pwExpect(await page.screenshot()).toMatchSnapshot('home-page-first-7-posts-only-titles-2.png')
  })

  test('Sub Page', async ({ page }) => {
    await page.goto('/sub/aww', { waitUntil: 'networkidle' })

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('sub-page.png')
  })

  test('Search Page with results', async ({ page, viewport, isMobile }) => {
    await page.goto('/search', { waitUntil: 'networkidle' })

    await page.locator('#search-input').fill('or')

    await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')])

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: isMobile ? 12000 : 8000 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('search-page-with-results.png')
  })

  test('article link only post', async ({ page }) => {
    await page.goto('/post/a0a0')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    pwExpect(await page.screenshot()).toMatchSnapshot('article-link-only-post-page.png')
  })

  test('cross post', async ({ page, viewport }) => {
    await page.goto('/post/a0g6')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: 30000 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('cross-post-page.png')
  })

  test('image post', async ({ page, viewport }) => {
    await page.goto('/post/a0b1')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: 3000 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('image-post-page.png')
  })

  test('image gallery post', async ({ page, viewport }) => {
    await page.goto('/post/b1b1')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: 3000 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('image-gallery-post-page.png', { threshold: 0.8 })

    await page.click('button.splide__arrow.splide__arrow--next')

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('image-gallery-next-image-post-page.png', {
      threshold: 0.8,
    })

    await page.click('button.splide__arrow.splide__arrow--next')

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('image-gallery-next2-image-post-page.png', {
      threshold: 0.8,
    })

    await page.click('button.splide__arrow.splide__arrow--prev')

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('image-gallery-prev-image-post-page.png', {
      threshold: 0.8,
    })

    await page.click('button.splide__arrow.splide__arrow--prev')

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('image-gallery-prev1-image-post-page.png', {
      threshold: 0.8,
    })
  })

  test('self post question in title no text no link ', async ({ page, viewport }) => {
    await page.goto('/post/a0c2')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: 3000 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('self-post-question-in-title-no-text-no-link-page.png')
  })

  test('text post link in text ', async ({ page, viewport }) => {
    await page.goto('/post/a0d3')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: 3000 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('text-post-link-in-text-page.png')
  })

  test('text post no link ', async ({ page, viewport }) => {
    await page.goto('/post/a0e4')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: 3000 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('text-post-no-link-page.png')
  })

  test('video post', async ({ page, viewport }) => {
    await page.goto('/post/a0f5')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
      })
    })

    await page.setViewportSize({ width: viewport?.width as number, height: 3000 })

    await waitForTextRendering(page)

    pwExpect(await page.screenshot()).toMatchSnapshot('video-post-page.png')
  })

  test.afterAll(async () => {
    await resetTestUserSettings()
  })
})
