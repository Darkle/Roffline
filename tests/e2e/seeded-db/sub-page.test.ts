import { test, expect as pwExpect } from '@playwright/test'
import type { Dialog } from '@playwright/test'
import { expect } from 'chai'
import Prray from 'prray'
import { DateTime } from 'luxon'
import type { Post } from '../../../db/entities/Posts/Post.d'

import {
  createLoginCookie,
  resetTestUserSettings,
  showWebPageErrorsInTerminal,
  checkElementExists,
  DB,
} from '../../test-utils'

test.describe('Sub Page', () => {
  test.beforeAll(async () => {
    await resetTestUserSettings()
  })

  test.beforeEach(async ({ context, page }) => {
    showWebPageErrorsInTerminal(page)
    await createLoginCookie(context)
    await page.goto('/sub/aww')
  })

  test('validates sub page html and text', async ({ page }) => {
    await pwExpect(page).toHaveTitle('aww - Roffline')

    await page.evaluate(() => {
      Array.from(document.querySelectorAll('time')).forEach(timeElem => {
        // eslint-disable-next-line no-param-reassign
        timeElem.textContent = `27 minutes ago`
        timeElem.setAttribute('datetime', '2022 Jan 29, 4:53 AM')
      })
    })

    const [navHTML, headHTML, mainHTML] = await page.evaluate(() => [
      document.querySelector('header>nav')?.outerHTML,
      document.querySelector('head')?.outerHTML,
      document.querySelector('main')?.outerHTML,
    ])

    pwExpect(headHTML).toMatchSnapshot('sub-page-head-html.txt')
    pwExpect(navHTML).toMatchSnapshot('sub-page-nav-menu-html.txt')
    pwExpect(mainHTML).toMatchSnapshot('sub-page-main-html.txt')

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML).toMatchSnapshot('sub-page-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML2 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML2).toMatchSnapshot('sub-page-pagination-next-page-html.txt')
  })

  test('validates top filter html and text', async ({ page }) => {
    const oneDayAgo = Math.round(
      DateTime.now()
        .minus({ ['day']: 1 })
        .toSeconds()
    )
    const twoDaysAgo = Math.round(
      DateTime.now()
        .minus({ ['day']: 2 })
        .toSeconds()
    )
    // gonna make it empty to check the html for when its empty
    const postsForDayFilter = (await DB.all(`SELECT * FROM posts WHERE created_utc>${oneDayAgo}`)) as Post[]

    await Prray.from(postsForDayFilter).forEachAsync(post =>
      DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [twoDaysAgo, post.id])
    )

    await page.goto('/sub/aww?topFilter=day')

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))
    await checkElementExists(page.locator('main>h4.filter-header:has-text("Top: Day")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(0)

    await checkElementExists(
      page.locator('#posts>.no-posts-found-message:has-text("No posts found for this date filter.")')
    )

    await pwExpect(page.locator('nav.pagination')).toHaveCount(0)

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    await Prray.from(postsForDayFilter).forEachAsync(post =>
      DB.run(`UPDATE posts SET created_utc=? WHERE id=?`, [post.created_utc, post.id])
    )

    // =============================

    await page.goto('/sub/aww?topFilter=week')

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))
    await checkElementExists(page.locator('main>h4.filter-header:has-text("Top: Week")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML3 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML3).toMatchSnapshot('sub-page-filter-week-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))
    await checkElementExists(page.locator('main>h4.filter-header:has-text("Top: Week")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML4 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML4).toMatchSnapshot('sub-page-filter-week-next-page-html.txt')

    // =============================

    await page.goto('/sub/aww?topFilter=month')

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))
    await checkElementExists(page.locator('main>h4.filter-header:has-text("Top: Month")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML5 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML5).toMatchSnapshot('sub-page-filter-month-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))
    await checkElementExists(page.locator('main>h4.filter-header:has-text("Top: Month")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML6 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML6).toMatchSnapshot('sub-page-filter-month-next-page-html.txt')

    // =============================

    await page.goto('/sub/aww?topFilter=year')

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))
    await checkElementExists(page.locator('main>h4.filter-header:has-text("Top: Year")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML7 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML7).toMatchSnapshot('sub-page-filter-year-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))
    await checkElementExists(page.locator('main>h4.filter-header:has-text("Top: Year")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML8 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML8).toMatchSnapshot('sub-page-filter-year-next-page-html.txt')

    // =============================

    await page.goto('/sub/aww?topFilter=all')

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))
    await checkElementExists(page.locator('main>h4.filter-header:has-text("Top: All")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML9 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML9).toMatchSnapshot('sub-page-filter-all-pagination-html.txt')

    await checkElementExists(page.locator('body>script[src^="/js/index-page.js"]'))

    // Check page 2
    await Promise.all([page.waitForNavigation(), page.click('nav.pagination>a:nth-of-type(2)')])

    await checkElementExists(page.locator('main>h4.filter-header:has-text("Sub: Aww")'))
    await checkElementExists(page.locator('main>h4.filter-header:has-text("Top: All")'))

    await pwExpect(page.locator('.post-container')).toHaveCount(30)
    await pwExpect(page.locator('.post-container>article>h2>a[href^="/post/"]')).toHaveCount(30)

    const paginationHTML10 = await page.evaluate(() => document.querySelector('nav.pagination')?.outerHTML)

    pwExpect(paginationHTML10).toMatchSnapshot('sub-page-filter-all-next-page-html.txt')
  })

  test('make sure its only showing the posts from the sub', async ({ page }) => {
    const postIdsOfPostsOnPage = await page.evaluate(() => {
      const postLinks = Array.from(
        document.querySelectorAll('.post-container>article>h2>a')
      ) as HTMLAnchorElement[]

      return postLinks.map(elem => elem.href.split('/post/')[1])
    })

    const postsFromDB = (await DB.all(
      `SELECT * FROM posts WHERE id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=? OR id=?`,
      postIdsOfPostsOnPage
    )) as Post[]

    expect(postsFromDB.length).to.be.above(0)

    postsFromDB.forEach((post: Post) => {
      expect(post.subreddit).to.equal('aww')
    })
  })

  test('shows message when still getting subs post', async ({ page }) => {
    await page.goto('/sub-management')

    await page.fill('input[name="subToAdd"]', 'news')
    await page.click('input[type="submit"]')
    await page.waitForLoadState('networkidle')

    await page.goto('/sub/news')

    await pwExpect(page.locator('.post-container')).toHaveCount(0)

    await pwExpect(page.locator('nav.pagination')).toHaveCount(0)

    await checkElementExists(
      page.locator(
        '#posts>.no-posts-found-message:has-text("This subreddit either has no posts, or is in the download queue.")'
      )
    )

    await page.goto('/sub-management')

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    page.on('dialog', (dialog: Dialog): Promise<void> => dialog.accept())

    await page.click('.sub-removal-container .sub-container:has-text("news")')
    await page.waitForLoadState('networkidle')
  })
})
