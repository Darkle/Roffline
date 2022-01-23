import { test, expect as pwExpect } from '@playwright/test'
import { expect } from 'chai'

import {
  createLoginCookie,
  resetTestUserSettings,
  checkElementExists,
  showWebPageErrorsInTerminal,
  DB,
} from '../../test-utils'

test.describe('Home Page', () => {
  test.beforeEach(async ({ context, page }) => {
    showWebPageErrorsInTerminal(page)
    await createLoginCookie(context)
    await resetTestUserSettings()
    await page.goto('/')
  })

  test('validates home page html and text', async ({ page }) => {
    await pwExpect(page).toHaveTitle('Roffline Home Page')

    const [navHTML, headHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('home-page-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('home-page-nav-menu-html.txt')

    const firstSevenPostsHTML = await page.evaluate(() => {
      const firstSevenPosts = document.querySelectorAll('main>#posts>.post-container:nth-child(-n+7)')
      return Array.from(firstSevenPosts).map(elem => {
        // remove the time elem as that will change so cant snapshot it.
        elem.querySelector('time')?.remove()
        return elem.outerHTML
      })
    })

    firstSevenPostsHTML.forEach((postHTML, index) =>
      pwExpect(postHTML).toMatchSnapshot(`home-page-post-${index + 1}-html.txt`)
    )

    const galleryPostHTML = await page.evaluate(() => {
      const galleryPost = document.querySelector('.gallery-container')?.parentElement?.parentElement
        ?.parentElement as HTMLDivElement

      // remove the time elem as that will change so cant snapshot it.
      galleryPost.querySelector('time')?.remove()
      return galleryPost.outerHTML
    })

    pwExpect(galleryPostHTML).toMatchSnapshot('home-page-gallery-post-html.txt')

    const paginationHTML = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML).toMatchSnapshot('home-page-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML2 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML2).toMatchSnapshot('home-page-pagination-next-page-html.txt')
  })

  test('validates top filter html and text', async ({ page }) => {
    await page.goto('/?topFilter=day')

    const filterHeaderHTML1 = await page.evaluate(() => document.querySelector('main>.filter-header')?.outerHTML)

    pwExpect(filterHeaderHTML1).toMatchSnapshot('home-page-filter-day-header-html.txt')

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML1 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML1).toMatchSnapshot('home-page-filter-day-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML2 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML2).toMatchSnapshot('home-page-filter-day-next-page-html.txt')

    // =============================

    await page.goto('/?topFilter=week')

    const filterHeaderHTML2 = await page.evaluate(() => document.querySelector('main>.filter-header')?.outerHTML)

    pwExpect(filterHeaderHTML2).toMatchSnapshot('home-page-filter-week-header-html.txt')

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML3 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML3).toMatchSnapshot('home-page-filter-week-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML4 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML4).toMatchSnapshot('home-page-filter-week-next-page-html.txt')

    // =============================

    await page.goto('/?topFilter=month')

    const filterHeaderHTML3 = await page.evaluate(() => document.querySelector('main>.filter-header')?.outerHTML)

    pwExpect(filterHeaderHTML3).toMatchSnapshot('home-page-filter-month-header-html.txt')

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML5 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML5).toMatchSnapshot('home-page-filter-month-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML6 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML6).toMatchSnapshot('home-page-filter-month-next-page-html.txt')

    // =============================

    await page.goto('/?topFilter=year')

    const filterHeaderHTML4 = await page.evaluate(() => document.querySelector('main>.filter-header')?.outerHTML)

    pwExpect(filterHeaderHTML4).toMatchSnapshot('home-page-filter-year-header-html.txt')

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML7 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML7).toMatchSnapshot('home-page-filter-year-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML8 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML8).toMatchSnapshot('home-page-filter-year-next-page-html.txt')

    // =============================

    await page.goto('/?topFilter=all')

    const filterHeaderHTML5 = await page.evaluate(() => document.querySelector('main>.filter-header')?.outerHTML)

    pwExpect(filterHeaderHTML5).toMatchSnapshot('home-page-filter-all-header-html.txt')

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML9 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML9).toMatchSnapshot('home-page-filter-all-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML10 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML10).toMatchSnapshot('home-page-filter-all-next-page-html.txt')
  })

  test('infinite scroll works and loads more posts', async ({ page }) => {
    await page.goto('/settings')

    const infiniteScrollEnabled = await page.locator('input[data-setting-name="infiniteScroll"]').isChecked()

    if (!infiniteScrollEnabled) {
      await page.click('input[data-setting-name="infiniteScroll"]')
    }

    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(1000)

    await page.goto('/')

    await pwExpect(page.locator('nav.pagination')).toHaveCount(0)

    const numOfPostInitial = await page.locator(`main>#posts>.post-container`).count()

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // I dunno why but Firefox stalls on this one so make it a waitForTimeout
    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(500)

    const numOfPostAfterScroll1 = await page.locator(`main>#posts>.post-container`).count()

    expect(numOfPostInitial).to.not.equal(numOfPostAfterScroll1)

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // I dunno why but Firefox stalls on this one so make it a waitForTimeout
    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(500)

    const numOfPostAfterScroll2 = await page.locator(`main>#posts>.post-container`).count()

    expect(numOfPostInitial).to.not.equal(numOfPostAfterScroll2)
    expect(numOfPostAfterScroll1).to.not.equal(numOfPostAfterScroll2)

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(500)

    const numOfPostAfterScroll3 = await page.locator(`main>#posts>.post-container`).count()

    expect(numOfPostInitial).to.not.equal(numOfPostAfterScroll3)
    expect(numOfPostAfterScroll1).to.not.equal(numOfPostAfterScroll3)
    expect(numOfPostAfterScroll2).to.not.equal(numOfPostAfterScroll3)
  })

  test('only show titles in feed', async ({ page }) => {
    await page.goto('/settings')

    const onlyTitlesEnabled = await page.locator('input[data-setting-name="onlyShowTitlesInFeed"]').isChecked()

    if (!onlyTitlesEnabled) {
      await page.click('input[data-setting-name="onlyShowTitlesInFeed"]')
    }

    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(1000)

    await page.goto('/')

    await pwExpect(page.locator('.post-content')).toHaveCount(0)

    const firstSevenPostsHTML = await page.evaluate(() => {
      const firstSevenPosts = document.querySelectorAll('main>#posts>.post-container:nth-child(-n+7)')
      return Array.from(firstSevenPosts).map(elem => {
        // remove the time elem as that will change so cant snapshot it.
        elem.querySelector('time')?.remove()
        return elem.outerHTML
      })
    })

    firstSevenPostsHTML.forEach((postHTML, index) =>
      pwExpect(postHTML).toMatchSnapshot(`home-page-post-titles-only-${index + 1}-html.txt`)
    )
  })

  test('hide stickied posts', async ({ page }) => {
    await checkElementExists(page.locator('#posts>.post-container>article>h2>a[href="/post/a0a0"]'))

    // Set the first post to be stickied
    await DB.run(`UPDATE posts SET stickied=1 WHERE id='a0a0'`)

    await page.goto('/settings')

    const hideStickiedPostsEnabled = await page
      .locator('input[data-setting-name="hideStickiedPosts"]')
      .isChecked()

    if (!hideStickiedPostsEnabled) {
      await page.click('input[data-setting-name="hideStickiedPosts"]')
    }

    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(1000)

    await page.goto('/')

    await pwExpect(page.locator('#posts>.post-container>article>h2>a[href="/post/a0a0"]')).toHaveCount(0)

    await DB.run(`UPDATE posts SET stickied=0 WHERE id='a0a0'`)
  })

  test('video player plays/pauses on click', async ({ page }) => {
    const pausedStatusOfallVideosOnThePage = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).map(elem => elem.paused)
    )

    pausedStatusOfallVideosOnThePage.forEach(elemPausedStatus => {
      expect(elemPausedStatus).to.be.true
    })

    await page.click('video')

    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(500)

    const pausedStatusOfallVideosOnThePage2 = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).map(elem => elem.paused)
    )

    pausedStatusOfallVideosOnThePage2.forEach((elemPausedStatus, index) => {
      if (index === 0) {
        expect(elemPausedStatus).to.be.false
      } else {
        expect(elemPausedStatus).to.be.true
      }
    })

    await page.click('video')

    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(500)

    const pausedStatusOfallVideosOnThePage3 = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).map(elem => elem.paused)
    )

    pausedStatusOfallVideosOnThePage3.forEach(elemPausedStatus => {
      expect(elemPausedStatus).to.be.true
    })

    await page.click(':nth-match(video, 2)')

    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(500)

    const pausedStatusOfallVideosOnThePage4 = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).map(elem => elem.paused)
    )

    pausedStatusOfallVideosOnThePage4.forEach((elemPausedStatus, index) => {
      if (index === 1) {
        expect(elemPausedStatus).to.be.false
      } else {
        expect(elemPausedStatus).to.be.true
      }
    })

    await page.click(':nth-match(video, 2)')

    // eslint-disable-next-line ui-testing/no-hard-wait
    await page.waitForTimeout(500)

    const pausedStatusOfallVideosOnThePage5 = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).map(elem => elem.paused)
    )

    pausedStatusOfallVideosOnThePage5.forEach(elemPausedStatus => {
      expect(elemPausedStatus).to.be.true
    })
  })

  test('video audio works and syncs with all video elems', async ({ page }) => {
    const mutedStatusOfallVideosOnThePage = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).map(elem => elem.muted)
    )

    mutedStatusOfallVideosOnThePage.forEach(elemPausedStatus => {
      expect(elemPausedStatus).to.be.false
    })

    await page.evaluate(() => {
      const firstVideoElem = document.querySelector('video') as HTMLVideoElement
      firstVideoElem.muted = true
    })

    const mutedStatusOfallVideosOnThePage2 = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).map(elem => elem.muted)
    )

    mutedStatusOfallVideosOnThePage2.forEach(elemPausedStatus => {
      expect(elemPausedStatus).to.be.true
    })

    await page.evaluate(() => {
      const firstVideoElem = document.querySelector('video') as HTMLVideoElement
      firstVideoElem.muted = false
    })

    const volumeStatusOfallVideosOnThePage = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).map(elem => elem.volume)
    )

    volumeStatusOfallVideosOnThePage.forEach(elemVolume => {
      expect(elemVolume).to.equal(volumeStatusOfallVideosOnThePage[0])
    })

    await page.evaluate(() => {
      const firstVideoElem = document.querySelector('video') as HTMLVideoElement
      firstVideoElem.volume = 0.8
    })

    const volumeStatusOfallVideosOnThePage2 = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).map(elem => elem.volume)
    )

    volumeStatusOfallVideosOnThePage2.forEach(elemVolume => {
      expect(elemVolume).to.equal(volumeStatusOfallVideosOnThePage2[0])
    })
  })

  test('gallery works', async ({ page }) => {
    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:first-of-type').first()
    ).toHaveClass('splide__slide is-active is-visible')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(2)').first()
    ).toHaveClass('splide__slide is-next')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(3)').first()
    ).toHaveClass('splide__slide')

    await page.click('button.splide__arrow.splide__arrow--next')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:first-of-type').first()
    ).toHaveClass('splide__slide is-prev')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(2)').first()
    ).toHaveClass('splide__slide is-active is-visible')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(3)').first()
    ).toHaveClass('splide__slide is-next')

    await page.click('button.splide__arrow.splide__arrow--next')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:first-of-type').first()
    ).toHaveClass('splide__slide')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(2)').first()
    ).toHaveClass('splide__slide is-prev')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(3)').first()
    ).toHaveClass('splide__slide is-active is-visible')

    await page.click('button.splide__arrow.splide__arrow--prev')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:first-of-type').first()
    ).toHaveClass('splide__slide is-prev')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(2)').first()
    ).toHaveClass('splide__slide is-active is-visible')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(3)').first()
    ).toHaveClass('splide__slide is-next')

    await page.click('button.splide__arrow.splide__arrow--prev')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:first-of-type').first()
    ).toHaveClass('splide__slide is-active is-visible')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(2)').first()
    ).toHaveClass('splide__slide is-next')

    await pwExpect(
      page.locator('.gallery-container .splide__track .splide__list li:nth-of-type(3)').first()
    ).toHaveClass('splide__slide')
  })
})
