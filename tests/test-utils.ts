import sqlite3 from 'sqlite3'
import { expect as pwExpect } from '@playwright/test'
import type { Locator, BrowserContext, Page } from '@playwright/test'

const testingDefaultUser = process.env['TESTING_DEFAULT_USER'] as string

const checkElementExists = (locator: Locator): Promise<Locator> => pwExpect(locator).toHaveCount(1)

const db = new sqlite3.Database(process.env['SQLITE_DBPATH'] as string)

/* eslint-disable @typescript-eslint/restrict-plus-operands */

const sqlite3Handler = (
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any | any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (value: any | PromiseLike<any>) => any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void,
  err: Error,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any | any[]
  // eslint-disable-next-line max-params
): void => {
  if (err) {
    console.log('Error running sql: ' + sql)
    if (params) {
      console.log('Params: ' + params)
    }
    console.error(err)
    reject(err as Error)
  } else {
    resolve(results)
  }
}
const DB = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(sql: string, params?: any | any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.run(sql, params, (err: Error, results: any | any[]) =>
        sqlite3Handler(sql, params, resolve, reject, err, results)
      )
    })
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(sql: string, params?: any | any[]): Promise<void | any> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.get(sql, params, (err: Error, results: any | any[]) =>
        sqlite3Handler(sql, params, resolve, reject, err, results)
      )
    })
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all(sql: string, params?: any | any[]): Promise<void | any[]> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.all(sql, params, (err: Error, results: any | any[]) =>
        sqlite3Handler(sql, params, resolve, reject, err, results)
      )
    })
  },
}

const createLoginCookie = (browserContext: BrowserContext): Promise<void> =>
  browserContext.addCookies([
    {
      name: 'loggedInUser',
      value: process.env['TESTING_DEFAULT_USER'] as string,
      httpOnly: true,
      sameSite: 'Strict',
      domain: `0.0.0.0`,
      path: '/',
    },
  ])

const createTestUser = async (): Promise<void> => {
  await DB.run(
    'INSERT OR IGNORE INTO users (name,subreddits,hideStickiedPosts,onlyShowTitlesInFeed,infiniteScroll,darkModeTheme) VALUES (?,?,?,?,?,?);',
    [testingDefaultUser, '[]', 1, 0, 0, 0]
  )
}

const resetTestUserSettings = async (): Promise<void> => {
  await DB.run(
    `UPDATE users SET subreddits=json('["aww", "askreddit"]'),hideStickiedPosts=1,onlyShowTitlesInFeed=0,infiniteScroll=0,darkModeTheme=0 WHERE name='${testingDefaultUser}';`
  )
}

const createTestSubs = async (): Promise<void> => {
  await DB.run(
    `CREATE TABLE IF NOT EXISTS subreddit_table_aww (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);`
  )
  await DB.run(
    `INSERT OR IGNORE INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('aww', ${Date.now()});    `
  )
  await DB.run(
    `CREATE TABLE IF NOT EXISTS subreddit_table_askreddit (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);`
  )
  await DB.run(
    `INSERT OR IGNORE INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('askreddit', ${Date.now()});`
  )
  await DB.run(
    `UPDATE users SET subreddits=json('["aww", "askreddit"]') WHERE name = 'shine-9000-shack-today-6';`
  )
}

const deleteTestUser = async (): Promise<void> => {
  await DB.run('DELETE FROM users WHERE name = ?', testingDefaultUser)
}

const showWebPageErrorsInTerminal = (page: Page): void => {
  page.on('pageerror', (...args) => {
    console.error(...args)
    throw new Error('🚨⚠️ Uncaught Error Occured In Webpage ⚠️🚨')
  })

  // eslint-disable-next-line @typescript-eslint/no-misused-promises,complexity
  page.on('console', async msg => {
    if (msg.type() !== 'error') return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = []

    // eslint-disable-next-line no-await-in-loop
    for (const arg of msg.args()) values.push(await arg.jsonValue())

    /*****
      There is a weird intermittent bug when in dark mode where something doesnt load.
      I dont know what it is or how to fix it, so dont throw on it.
    *****/

    const isDarkModeBug =
      typeof values[0] === 'string' &&
      values[0].startsWith('TypeError: NetworkError when attempting to fetch resource')

    if (!isDarkModeBug) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.error(...values)
      throw new Error('🚨⚠️ console.error called In Webpage ⚠️🚨')
    }
  })
}

const removeAllSubreddits = async (): Promise<void> => {
  await DB.run(`DELETE FROM 'subreddits_master_list';`)

  const subTablesToDelete = (await DB.all(
    `SELECT name FROM sqlite_master WHERE name LIKE 'subreddit_table_%'`
  )) as {
    name: string
  }[]

  if (subTablesToDelete.length > 0) {
    await DB.run(
      subTablesToDelete.reduce((acc, { name: subTableName }) => `${acc}DROP TABLE ${subTableName};`, '')
    )
  }

  await DB.run(
    `UPDATE users SET subreddits = '[]' where name = '${process.env['TESTING_DEFAULT_USER'] as string}'`
  )
}

const resetAdminSettingsBackToDefault = async (): Promise<void> => {
  await DB.run(
    `UPDATE admin_settings SET downloadComments = true, numberFeedsOrPostsDownloadsAtOnce = 4, numberMediaDownloadsAtOnce = 2, downloadVideos = false, videoDownloadMaxFileSize = '300', videoDownloadResolution = '480p', updateAllDay = true, updateStartingHour = 1, updateEndingHour = 5;`
  )
}

/*****
      The text on the page needs some extra time to settle in terms if it being rendered. I dunno
      why this happens, but the text needs an extra moment to be rendered right or something. I
      think its the font kerning or something. Perhaps its the particular fonts i'm using. If I
      dont add a small delay, the text is slightly different and the visual diff tests dont pass.
      I tried adding `{ waitUntil: 'networkidle' }` to the page.goto's, but it didnt help.
    *****/
// eslint-disable-next-line ui-testing/no-hard-wait
const waitForTextRendering = (page: Page, timeout = 1000): Promise<void> => page.waitForTimeout(timeout)

export {
  checkElementExists,
  DB,
  createLoginCookie,
  createTestUser,
  deleteTestUser,
  showWebPageErrorsInTerminal,
  removeAllSubreddits,
  resetAdminSettingsBackToDefault,
  createTestSubs,
  waitForTextRendering,
  resetTestUserSettings,
}
