import { expect as pwExpect } from '@playwright/test'
import type { Locator, BrowserContext, Page } from '@playwright/test'
import execa from 'execa'
import SqlString from 'sqlstring-sqlite'

const testingDefaultUser = process.env['TESTING_DEFAULT_USER'] as string

const checkElementExists = (locator: Locator): Promise<Locator> => pwExpect(locator).toHaveCount(1)

/* eslint-disable @typescript-eslint/restrict-plus-operands */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RUNDB = (sql: string, params?: any | any[] | Record<string, unknown>): execa.ExecaChildProcess<string> =>
  execa.command(
    'sqlite3 -batch' +
      " '" +
      process.env['SQLITE_DBPATH'] +
      "' " +
      '"' +
      (params
        ? // eslint-disable-next-line
          SqlString.format(sql, params)
        : sql) +
      '"',
    {
      cleanup: true,
      shell: true,
    }
  )

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
  await RUNDB(
    'INSERT OR IGNORE INTO users (name,subreddits,hideStickiedPosts,onlyShowTitlesInFeed,infiniteScroll,darkModeTheme) VALUES (?,?,?,?,?,?);',
    [testingDefaultUser, '[]', 1, 0, 0, 0]
  )
}

const createTestSubs = async (): Promise<void> => {
  await RUNDB(
    `
CREATE TABLE IF NOT EXISTS subreddit_table_aww (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);
INSERT OR IGNORE INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('aww', 1642383761179);
CREATE TABLE IF NOT EXISTS subreddit_table_askreddit (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);
INSERT OR IGNORE INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('askreddit', 1642383761179);
UPDATE users SET subreddits='"[\\"aww\\",\\"askreddit\\"]"' WHERE name = 'shine-9000-shack-today-6';    
    `
  )
}

const deleteTestUser = async (): Promise<void> => {
  await RUNDB('DELETE FROM users WHERE name = ?', testingDefaultUser)
}

const showWebPageErrorsInTerminal = (page: Page): void => {
  page.on('pageerror', (...args) => {
    console.error(...args)
    throw new Error('🚨⚠️ Uncaught Error Occured In Webpage ⚠️🚨')
  })

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  page.on('console', async msg => {
    if (msg.type() !== 'error') return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = []

    // eslint-disable-next-line no-await-in-loop
    for (const arg of msg.args()) values.push(await arg.jsonValue())

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error(...values)
    throw new Error('🚨⚠️ console.error called In Webpage ⚠️🚨')
  })
}

const removeAllSubreddits = async (): Promise<void> => {
  await RUNDB(`DELETE FROM 'subreddits_master_list';`)

  const { stdout } = await RUNDB(`SELECT name FROM sqlite_master WHERE name LIKE 'subreddit_table_%'`)

  if (stdout.trim().length > 0) {
    const subTablesToDelete = stdout.split('\n')
    await RUNDB(subTablesToDelete.reduce((acc, subTableName) => `${acc}DROP TABLE ${subTableName};`, ''))
  }

  await RUNDB(
    `UPDATE users SET subreddits = '[]' where name = '${process.env['TESTING_DEFAULT_USER'] as string}'`
  )
}

const resetAdminSettingsBackToDefault = async (): Promise<void> => {
  await RUNDB(
    `UPDATE admin_settings SET downloadComments = true, numberFeedsOrPostsDownloadsAtOnce = 4, numberMediaDownloadsAtOnce = 2, downloadVideos = false, videoDownloadMaxFileSize = '300', videoDownloadResolution = '480p', updateAllDay = true, updateStartingHour = 1, updateEndingHour = 5;`
  )
}

export {
  checkElementExists,
  RUNDB,
  createLoginCookie,
  createTestUser,
  deleteTestUser,
  showWebPageErrorsInTerminal,
  removeAllSubreddits,
  resetAdminSettingsBackToDefault,
  createTestSubs,
}
