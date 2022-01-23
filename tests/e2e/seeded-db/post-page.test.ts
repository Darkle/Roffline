import { test, expect as pwExpect } from '@playwright/test'
import { DateTime } from 'luxon'
import { expect } from 'chai'
import lmdb from 'lmdb'
import { Packr } from 'msgpackr'

import {
  createLoginCookie,
  resetTestUserSettings,
  checkElementExists,
  showWebPageErrorsInTerminal,
  DB,
} from '../../test-utils'

const commentsDB = lmdb.open({ path: process.env['COMMENTS_DBPATH'] as string, encoding: 'binary' })
const msgpackPacker = new Packr()

test.describe('Post Pages', () => {
  test.beforeAll(async () => {
    await resetTestUserSettings()
  })

  test.beforeEach(async ({ context, page }) => {
    showWebPageErrorsInTerminal(page)
    await createLoginCookie(context)
  })

  test('validates (article link only) post page html and text', async ({ page }) => {
    await page.goto('/post/a0a0')

    await pwExpect(page).toHaveTitle('Kosovo pulls plug on energy-guzzling Bitcoin miners')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const [navHTML, headHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('article-link-only-post-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('article-link-only-post-nav-menu-html.txt')

    const articleHTML = await page.evaluate(() => document.querySelector('article')?.outerHTML)

    pwExpect(articleHTML).toMatchSnapshot('article-link-only-article-post-html.txt')

    const commentsHTML = await page.evaluate(() => document.querySelector('section.comments')?.outerHTML)

    pwExpect(commentsHTML).toMatchSnapshot('article-link-only-comments-post-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/post-page.js"]'))
  })

  test('validates (cross post) post page html and text', async ({ page }) => {
    await page.goto('/post/a0g6')

    await pwExpect(page).toHaveTitle(
      'Cost breakdown to run a chess website. It takes $420K to run lichess per year.'
    )

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const [navHTML, headHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('cross-post-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('cross-post-nav-menu-html.txt')

    const articleHTML = await page.evaluate(() => document.querySelector('article')?.outerHTML)

    pwExpect(articleHTML).toMatchSnapshot('cross-post-article-html.txt')

    const commentsHTML = await page.evaluate(() => document.querySelector('section.comments')?.outerHTML)

    pwExpect(commentsHTML).toMatchSnapshot('cross-post-comments-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/post-page.js"]'))
  })

  test('validates (image) post page html and text', async ({ page }) => {
    await page.goto('/post/a0b1')

    await pwExpect(page).toHaveTitle(
      `Met this gentle tiger this morning, probably the best photo I've ever taken.`
    )

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const [navHTML, headHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('image-post-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('image-post-nav-menu-html.txt')

    const articleHTML = await page.evaluate(() => document.querySelector('article')?.outerHTML)

    pwExpect(articleHTML).toMatchSnapshot('image-article-post-html.txt')

    const commentsHTML = await page.evaluate(() => document.querySelector('section.comments')?.outerHTML)

    pwExpect(commentsHTML).toMatchSnapshot('image-comments-post-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/post-page.js"]'))
  })

  test('validates (image gallery) post page html and text', async ({ page }) => {
    await page.goto('/post/b1b1')

    await pwExpect(page).toHaveTitle(
      `Met this gentle tiger this morning, probably the best photo I've ever taken.`
    )

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const [navHTML, headHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('image-gallery-post-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('image-gallery-post-nav-menu-html.txt')

    const articleHTML = await page.evaluate(() => document.querySelector('article')?.outerHTML)

    pwExpect(articleHTML).toMatchSnapshot('image-gallery-article-post-html.txt')

    const commentsHTML = await page.evaluate(() => document.querySelector('section.comments')?.outerHTML)

    pwExpect(commentsHTML).toMatchSnapshot('image-gallery-comments-post-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/post-page.js"]'))
  })

  test('validates (self post question in title no text no link) post page html and text', async ({ page }) => {
    await page.goto('/post/a0c2')

    await pwExpect(page).toHaveTitle('What book changed your life?')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const [navHTML, headHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('self-post-no-link-no-title-post-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('self-post-no-link-no-title-post-nav-menu-html.txt')

    const articleHTML = await page.evaluate(() => document.querySelector('article')?.outerHTML)

    pwExpect(articleHTML).toMatchSnapshot('self-post-no-link-no-title-article-post-html.txt')

    const commentsHTML = await page.evaluate(() => document.querySelector('section.comments')?.outerHTML)

    pwExpect(commentsHTML).toMatchSnapshot('self-post-no-link-no-title-comments-post-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/post-page.js"]'))
  })

  test('validates (text post link in text) post page html and text', async ({ page }) => {
    await page.goto('/post/a0d3')

    await pwExpect(page).toHaveTitle('FUML - Functional data serialization language')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const [navHTML, headHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('text-post-link-in-text-post-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('text-post-link-in-text-post-nav-menu-html.txt')

    const articleHTML = await page.evaluate(() => document.querySelector('article')?.outerHTML)

    pwExpect(articleHTML).toMatchSnapshot('text-post-link-in-text-article-post-html.txt')

    const commentsHTML = await page.evaluate(() => document.querySelector('section.comments')?.outerHTML)

    pwExpect(commentsHTML).toMatchSnapshot('text-post-link-in-text-comments-post-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/post-page.js"]'))
  })

  test('validates (text post no link) post page html and text', async ({ page }) => {
    await page.goto('/post/a0e4')

    await pwExpect(page).toHaveTitle('How would look like a FP version or alternative to the repository pattern?')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const [navHTML, headHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('text-post-no-link-post-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('text-post-no-link-post-nav-menu-html.txt')

    const articleHTML = await page.evaluate(() => document.querySelector('article')?.outerHTML)

    pwExpect(articleHTML).toMatchSnapshot('text-post-no-link-article-post-html.txt')

    const commentsHTML = await page.evaluate(() => document.querySelector('section.comments')?.outerHTML)

    pwExpect(commentsHTML).toMatchSnapshot('text-post-no-link-comments-post-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/post-page.js"]'))
  })

  test('validates (video) post page html and text', async ({ page }) => {
    await page.goto('/post/a0f5')

    await pwExpect(page).toHaveTitle(
      'A 17 year old Biggie Smalls killing it in a Brooklyn street rap battle. Soon after, he would blow up and become recognised as one of if not the greatest hip hop artist of all time, before being murdered at the age of 24. RIP Biggie Smalls'
    )

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(elem => elem.remove())
    })

    const [navHTML, headHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('video-post-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('video-post-nav-menu-html.txt')

    const articleHTML = await page.evaluate(() => document.querySelector('article')?.outerHTML)

    pwExpect(articleHTML).toMatchSnapshot('video-article-post-html.txt')

    const commentsHTML = await page.evaluate(() => document.querySelector('section.comments')?.outerHTML)

    pwExpect(commentsHTML).toMatchSnapshot('video-comments-post-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/post-page.js"]'))
  })

  test('image gallery on image gallery post page works', async ({ page }) => {
    await page.goto('/post/b1b1')

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

  test('checks "ago" text is correct for datetime of datetime post created', async ({ page }) => {
    const first7Posts = (await DB.all(`SELECT created_utc,id FROM posts ORDER BY ROWID ASC LIMIT 7`)) as {
      id: string
      created_utc: number
    }[]

    const now = DateTime.fromMillis(Date.now(), { zone: 'Etc/UTC' })

    await Promise.all([
      DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [
        Number(now.minus({ seconds: 3 }).toSeconds().toFixed()),
        first7Posts[0].id,
      ]),
      DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [
        Number(now.minus({ minutes: 13 }).toSeconds().toFixed()),
        first7Posts[1].id,
      ]),
      DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [
        Number(now.minus({ hours: 3 }).toSeconds().toFixed()),
        first7Posts[2].id,
      ]),
      DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [
        Number(now.minus({ days: 5 }).toSeconds().toFixed()),
        first7Posts[3].id,
      ]),
      DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [
        Number(now.minus({ weeks: 3 }).toSeconds().toFixed()),
        first7Posts[4].id,
      ]),
      DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [
        Number(now.minus({ months: 8 }).toSeconds().toFixed()),
        first7Posts[5].id,
      ]),
      DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [
        Number(now.minus({ years: 3 }).toSeconds().toFixed()),
        first7Posts[6].id,
      ]),
    ])

    await page.goto('/post/a0a0')

    // eslint-disable-next-line ui-testing/no-css-page-layout-selector
    const timeElemText1 = await page.textContent('article .submission-data time')

    expect(timeElemText1).to.match(/ seconds ago$/u)

    await page.goto('/post/a0b1')

    // eslint-disable-next-line ui-testing/no-css-page-layout-selector
    const timeElemText2 = await page.textContent('article .submission-data time')

    expect(timeElemText2).to.match(/ minutes ago$/u)

    await page.goto('/post/a0c2')

    // eslint-disable-next-line ui-testing/no-css-page-layout-selector
    const timeElemText3 = await page.textContent('article .submission-data time')

    expect(timeElemText3).to.match(/ hours ago$/u)

    await page.goto('/post/a0d3')

    // eslint-disable-next-line ui-testing/no-css-page-layout-selector
    const timeElemText5 = await page.textContent('article .submission-data time')

    expect(timeElemText5).to.match(/ days ago$/u)

    await page.goto('/post/a0e4')

    // eslint-disable-next-line ui-testing/no-css-page-layout-selector
    const timeElemText6 = await page.textContent('article .submission-data time')

    expect(timeElemText6).to.match(/ weeks ago$/u)

    await page.goto('/post/a0f5')

    // eslint-disable-next-line ui-testing/no-css-page-layout-selector
    const timeElemText7 = await page.textContent('article .submission-data time')

    expect(timeElemText7).to.match(/ months ago$/u)

    await page.goto('/post/a0g6')

    // eslint-disable-next-line ui-testing/no-css-page-layout-selector
    const timeElemText8 = await page.textContent('article .submission-data time')

    expect(timeElemText8).to.match(/ years ago$/u)

    // put created_utc for the posts back to what they were
    await Promise.all(
      first7Posts.map(post => DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [post.created_utc, post.id]))
    )
  })

  test.only('shows message when comments are still being downloaded for a post', async ({ page }) => {
    await commentsDB.remove('a0a0')

    await page.goto('/post/a0a0')

    const commentsHTML = await page.evaluate(() => document.querySelector('section.comments')?.outerHTML)

    pwExpect(commentsHTML).toMatchSnapshot('post-comments-waiting-for-download.txt')

    await commentsDB.put('a0a0', msgpackPacker.pack([]))
  })
})
