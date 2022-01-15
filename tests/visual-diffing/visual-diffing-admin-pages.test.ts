import { test, expect as pwExpect } from '@playwright/test'
import type { Page } from '@playwright/test'

import { createTestUser, deleteTestUser, showWebPageErrorsInTerminal } from '../test-utils'

let p = null as null | Page

test.describe('Visual Diffing Admin Pages', () => {
  test.beforeAll(async () => {
    await createTestUser()
  })

  test.beforeEach(async ({ page, browser }) => {
    showWebPageErrorsInTerminal(page)
    const context = await browser.newContext({ httpCredentials: { username: 'admin', password: 'foo' } })
    p = await context.newPage()
  })

  test('Stats Page', async () => {
    const page = p as Page

    await page.goto('/admin/', { waitUntil: 'networkidle' })

    // Need to manually set all the stats as they are dynamic each time and will cause test to fail
    await page.evaluate(() => {
      const ulElem = document.querySelector('main ul') as HTMLUListElement
      const spanElem = document.querySelector('main ul li span') as HTMLSpanElement

      spanElem.textContent = 'Memory Usage: 148 MB'

      ulElem.children[1].textContent = 'CPU Usage: 37%'
      ulElem.children[2].textContent = 'Uptime: 6s'
      ulElem.children[3].textContent = 'Subreddits Tracked: 2'
      ulElem.children[4].textContent = 'Posts: 9247'
      ulElem.children[5].textContent = 'Users: 1'
      ulElem.children[6].textContent = 'Posts With Media Still To Download: 9247'
      ulElem.children[7].textContent = 'Media Folder Size: 1.94 GB'
      ulElem.children[8].textContent = 'DB Size: 4.38 MB'
      ulElem.children[9].textContent = 'Comments DB Size: 562 MB'
    })

    pwExpect(await page.screenshot()).toMatchSnapshot('stats-page.png')
  })

  test('Settings Page', async () => {
    const page = p as Page

    await page.goto('/admin/settings', { waitUntil: 'networkidle' })

    pwExpect(await page.screenshot()).toMatchSnapshot('settings-page.png')
  })

  test('Users Page', async ({ isMobile }) => {
    const page = p as Page

    await page.goto('/admin/users', { waitUntil: 'networkidle' })

    /*****
      The users page db table needs a fair bit of width, so increase for desktop. The db
      table auto shrinks when in mobile view.
    *****/
    if (!isMobile) {
      await page.setViewportSize({ width: 1600, height: 1480 })
    }

    pwExpect(await page.screenshot()).toMatchSnapshot('users-page.png')
  })

  test('Logs Page', async () => {
    const page = p as Page

    // Need to manually set the log data as its dynamic
    const logsSeedData = [
      {
        level: 20,
        time: '2022-01-15T11:12:42.961+11:00',
        name: 'roffline',
        sublogger: 'db',
        msg: 'db.batchAddCommentsToPosts for 9247 posts comments took [1] seconds [674] ms to complete',
      },
      {
        level: 20,
        time: '2022-01-15T11:12:39.452+11:00',
        name: 'roffline',
        sublogger: 'comments-downloads',
        msg: 'Getting posts comments - 100% complete.',
      },
      {
        level: 20,
        time: '2022-01-15T11:04:53.250+11:00',
        name: 'roffline',
        sublogger: 'comments-downloads',
        msg: 'Getting posts comments - 90% complete.',
      },
      {
        level: 20,
        time: '2022-01-15T10:23:33.935+11:00',
        name: 'roffline',
        sublogger: 'feeds',
        msg: 'fetching https://www.reddit.com/r/askreddit/top/.json?limit=100&t=day&count=100&after=t3_s3lode',
      },
      {
        level: 20,
        time: '2022-01-15T10:22:16.896+11:00',
        name: 'roffline',
        sublogger: 'feeds',
        msg: 'fetching https://www.reddit.com/r/aww/.json?limit=100&count=100',
      },
    ]

    await page.route('/admin/api/get-logs', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(logsSeedData),
      })
    })

    await page.goto('/admin/logs-viewer', { waitUntil: 'networkidle' })

    pwExpect(await page.screenshot()).toMatchSnapshot('logs-page.png')
  })

  test('DB Viewer Page', async () => {
    const page = p as Page

    // Need to manually set the db data as its dynamic
    const dbSeedData = {
      rows: [
        {
          id: 'hyts0n',
          subreddit: 'aww',
          author: 'N8theGr8',
          title: 'r/aww has a Discord server',
          selftext: '',
          selftext_html: null,
          score: 5018,
          is_self: 0,
          created_utc: 1595861810,
          domain: 'discord.gg',
          is_video: 0,
          stickied: 1,
          media_has_been_downloaded: 0,
          mediaDownloadTries: 0,
          post_hint: 'link',
          permalink: '/r/aww/comments/hyts0n/raww_has_a_discord_server/',
          url: 'https://discord.gg/UXfd5Pn',
          media: null,
          crosspost_parent: null,
          commentsDownloaded: 1,
        },
        {
          id: 's43nda',
          subreddit: 'aww',
          author: 'ZealousZombone',
          title: 'Nothing cuter than little spider girl 🕷️🕸️👩🏿',
          selftext: '',
          selftext_html: null,
          score: 1533,
          is_self: 0,
          created_utc: 1642197106,
          domain: 'reddit.com',
          is_video: 0,
          stickied: 0,
          media_has_been_downloaded: 0,
          mediaDownloadTries: 0,
          post_hint: null,
          permalink: '/r/aww/comments/s43nda/nothing_cuter_than_little_spider_girl/',
          url: 'https://www.reddit.com/gallery/s43nda',
          media: null,
          crosspost_parent: null,
          commentsDownloaded: 1,
        },
        {
          id: 's3oy6g',
          subreddit: 'aww',
          author: 'impetuous_panda',
          title: 'Majestic kitty',
          selftext: '',
          selftext_html: null,
          score: 53652,
          is_self: 0,
          created_utc: 1642154983,
          domain: 'v.redd.it',
          is_video: 1,
          stickied: 0,
          media_has_been_downloaded: 0,
          mediaDownloadTries: 0,
          post_hint: 'hosted:video',
          permalink: '/r/aww/comments/s3oy6g/majestic_kitty/',
          url: 'https://v.redd.it/ly2wo9jcomb81',
          media:
            '{"reddit_video":{"bitrate_kbps":2400,"fallback_url":"https://v.redd.it/ly2wo9jcomb81/DASH_720.mp4?source=fallback","height":720,"width":519,"scrubber_media_url":"https://v.redd.it/ly2wo9jcomb81/DASH_96.mp4","dash_url":"https://v.redd.it/ly2wo9jcomb81/DASHPlaylist.mpd?a=1644794537%2CMzQ4Yjg3NjRlMjk2OTYzNWEyZDhlZDcyMGZjZTFmZWM5ZjA3N2MzY2UxN2UwOWFjYjM1ZWQ5MzJiZjU2OWRhYg%3D%3D&amp;v=1&amp;f=hd","duration":15,"hls_url":"https://v.redd.it/ly2wo9jcomb81/HLSPlaylist.m3u8?a=1644794537%2CNjZlZTgxY2IzNzVmYTQxMjE2ZWZiNTU3MjAwNDljNzJmOWNhNWQ5YzkzNWQwODQyYjIxNTJlNjM4MDEyYWYwZQ%3D%3D&amp;v=1&amp;f=hd","is_gif":true,"transcoding_status":"completed"}}',
          crosspost_parent: null,
          commentsDownloaded: 1,
        },
        {
          id: 's3x1yc',
          subreddit: 'aww',
          author: 'Rude_Rub_5315',
          title: 'He just loves minimalism :)',
          selftext: '',
          selftext_html: null,
          score: 2365,
          is_self: 0,
          created_utc: 1642179467,
          domain: 'v.redd.it',
          is_video: 1,
          stickied: 0,
          media_has_been_downloaded: 0,
          mediaDownloadTries: 0,
          post_hint: 'hosted:video',
          permalink: '/r/aww/comments/s3x1yc/he_just_loves_minimalism/',
          url: 'https://v.redd.it/r3qawhvzoob81',
          media:
            '{"reddit_video":{"bitrate_kbps":2400,"fallback_url":"https://v.redd.it/r3qawhvzoob81/DASH_720.mp4?source=fallback","height":720,"width":405,"scrubber_media_url":"https://v.redd.it/r3qawhvzoob81/DASH_96.mp4","dash_url":"https://v.redd.it/r3qawhvzoob81/DASHPlaylist.mpd?a=1644794537%2CMTI1OWY2NTU3ZjhiOWE4YWVlNWJjNTVlZjdhNzc3YWRlNzNkOTg3YWRmN2I0Y2ViYjQyZmNmZjQ2MjcyNzM4Zg%3D%3D&amp;v=1&amp;f=hd","duration":15,"hls_url":"https://v.redd.it/r3qawhvzoob81/HLSPlaylist.m3u8?a=1644794537%2CODI2ZDgyZmJlM2M3NzI1YmE1ODA5ZTdjMWI5NGMzOGVlYzYzY2M0NjRkMzY1MWI1ZTg1YjBmMTg3ZDVhMGFmOA%3D%3D&amp;v=1&amp;f=hd","is_gif":true,"transcoding_status":"completed"}}',
          crosspost_parent: null,
          commentsDownloaded: 1,
        },
      ],
      count: 9247,
    }

    await page.route('/admin/api/get-paginated-table-data*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(dbSeedData),
      })
    })

    await page.goto('/admin/db-viewer', { waitUntil: 'networkidle' })

    pwExpect(await page.screenshot()).toMatchSnapshot('db-viewer-page.png')
  })

  test('Downloads Viewer Page', async () => {
    const page = p as Page

    const downloadsSeedData = [
      {
        id: 's44hqu',
        url: 'https://v.redd.it/gftk3divbqb81',
        permalink: '/r/aww/comments/s44hqu/i_lost_myself_in_those/',
        downloadStarted: true,
        mediaDownloadTries: 0,
        downloadFileSize: 877889,
        downloadedBytes: 877889,
        downloadProgress: Number((877889 / 877889).toPrecision(1)),
        status: 'active',
      },
      {
        id: 's44c32',
        url: 'https://www.reddit.com/gallery/s44c32',
        permalink: '/r/aww/comments/s44c32/we_got_her_from_the_animal_shelter_and_she_has/',
        mediaDownloadTries: 0,
        downloadStarted: true,
        downloadFileSize: 877889,
        downloadedBytes: 477889,
        downloadProgress: Number((477889 / 877889).toPrecision(1)),
        status: 'active',
      },
      {
        id: 's44a9w',
        url: 'https://i.imgur.com/PRcPmho.jpg',
        permalink: '/r/aww/comments/s44a9w/our_boy_is_starting_to_become_mostly_tail_at_this/',
        mediaDownloadTries: 1,
        downloadFailed: true,
        downloadError: 'Download failed',
        status: 'history',
      },
      {
        id: 's44a86',
        url: 'https://i.imgur.com/FFlJ0BK.gifv',
        permalink: '/r/aww/comments/s44a86/socks_off_please/',
        downloadSucceeded: true,
        status: 'history',
      },
      {
        id: 's449kl',
        url: 'https://www.reddit.com/r/AskReddit/comments/s449kl/what_is_something_youd_be_willing_to_spend_a_lot/',
        permalink: '/r/AskReddit/comments/s449kl/what_is_something_youd_be_willing_to_spend_a_lot/',
        downloadSkipped: true,
        downloadSkippedReason: 'Skipped Download',
        status: 'history',
      },
      {
        id: 's448pg',
        url: 'https://www.reddit.com/r/AskReddit/comments/s448pg/what_is_the_best_toy_you_remember_from_childhood/',
        permalink: '/r/AskReddit/comments/s448pg/what_is_the_best_toy_you_remember_from_childhood/',
        downloadCancelled: true,
        status: 'history',
      },
      {
        id: 's448gv',
        url: 'https://i.redd.it/a4wf11o2aqb81.jpg',
        permalink: '/r/aww/comments/s448gv/marzipan_the_cat_waiting_under_the_table_for_some/',
        mediaDownloadTries: 1,
        status: 'queued',
      },
      {
        id: 's448cu',
        url: 'https://www.reddit.com/r/AskReddit/comments/s448cu/how_do_you_heat_a_tortilla/',
        permalink: '/r/AskReddit/comments/s448cu/how_do_you_heat_a_tortilla/',
        mediaDownloadTries: 1,
        status: 'queued',
      },
      {
        id: 's4486j',
        url: 'https://www.reddit.com/r/AskReddit/comments/s4486j/when_did_you_realize_your_parents_didnt_love_you/',
        permalink: '/r/AskReddit/comments/s4486j/when_did_you_realize_your_parents_didnt_love_you/',
        status: 'queued',
      },
      {
        id: 's447f9',
        url: 'https://www.reddit.com/r/AskReddit/comments/s447f9/what_porm_hits_different_when_jerking_off_to/',
        permalink: '/r/AskReddit/comments/s447f9/what_porm_hits_different_when_jerking_off_to/',
        status: 'queued',
      },
      {
        id: 's4475p',
        url: 'https://www.reddit.com/r/AskReddit/comments/s4475p/you_have_died_and_you_are_reincarnated_but_you/',
        permalink: '/r/AskReddit/comments/s4475p/you_have_died_and_you_are_reincarnated_but_you/',
        status: 'queued',
      },
      {
        id: 's446x5',
        url: 'https://i.redd.it/vrtado7s9qb81.jpg',
        permalink: '/r/aww/comments/s446x5/his_little_fancy_freckle_feet/',
        status: 'queued',
      },
      {
        id: 's446ts',
        url: 'https://www.reddit.com/r/AskReddit/comments/s446ts/you_found_500k_in_cash_what_do_you_do_with_it/',
        permalink: '/r/AskReddit/comments/s446ts/you_found_500k_in_cash_what_do_you_do_with_it/',
        status: 'queued',
      },
      {
        id: 's446sy',
        url: 'https://www.reddit.com/r/AskReddit/comments/s446sy/what_is_statistic_thats_shockingly_small_or/',
        permalink: '/r/AskReddit/comments/s446sy/what_is_statistic_thats_shockingly_small_or/',
        status: 'queued',
      },
      {
        id: 's446o5',
        url: 'https://www.reddit.com/r/AskReddit/comments/s446o5/whats_a_big_nono_to_ask_on_a_first_date/',
        permalink: '/r/AskReddit/comments/s446o5/whats_a_big_nono_to_ask_on_a_first_date/',
        status: 'queued',
      },
      {
        id: 's446kh',
        url: 'https://www.reddit.com/r/AskReddit/comments/s446kh/people_of_reddit_what_do_you_consider_to_be_the/',
        permalink: '/r/AskReddit/comments/s446kh/people_of_reddit_what_do_you_consider_to_be_the/',
        status: 'queued',
      },
      {
        id: 's446jq',
        url: 'https://i.redd.it/3clrgmlo9qb81.jpg',
        permalink: '/r/aww/comments/s446jq/my_brothers_dog_as_a_pup/',
        status: 'queued',
      },
      {
        id: 's446hw',
        url: 'https://www.reddit.com/r/AskReddit/comments/s446hw/how_much_is_gas_where_you_live/',
        permalink: '/r/AskReddit/comments/s446hw/how_much_is_gas_where_you_live/',
        status: 'queued',
      },
      {
        id: 's44642',
        url: 'https://www.reddit.com/r/AskReddit/comments/s44642/book_readers_what_is_the_worst_movie_or_tv/',
        permalink: '/r/AskReddit/comments/s44642/book_readers_what_is_the_worst_movie_or_tv/',
        status: 'queued',
      },
      {
        id: 's445pc',
        url: 'https://i.redd.it/38gvuv8h9qb81.jpg',
        permalink: '/r/aww/comments/s445pc/please_teach_me_how_to_dog_cuz/',
        status: 'queued',
      },
      {
        id: 's445ot',
        url: 'https://www.reddit.com/r/AskReddit/comments/s445ot/what_rabbit_hole_did_you_immediately_regret_going/',
        permalink: '/r/AskReddit/comments/s445ot/what_rabbit_hole_did_you_immediately_regret_going/',
        status: 'queued',
      },
    ]

    await page.route('/admin/api/sse-media-downloads-viewer', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `event: page-load\ndata: ${JSON.stringify(downloadsSeedData)}\n\n`,
      })
    })

    /*****
     The downloads viewer page is fairly tall, so increase viewport height. 
     *****/
    const pageWidth = page.viewportSize()?.width as number
    await page.setViewportSize({ width: pageWidth, height: 3500 })

    // Dont use network idle here as this page is never network idle cause of SSE
    await page.goto('/admin/downloads-viewer')

    pwExpect(await page.screenshot()).toMatchSnapshot('downloads-viewer-page.png')
  })

  test.afterAll(async () => {
    await deleteTestUser()
  })
})
