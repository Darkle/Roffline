import { expect as pwExpect } from '@playwright/test'
import type { Locator, BrowserContext, Page } from '@playwright/test'
import execa from 'execa'
import SqlString from 'sqlstring'

const testingDefaultUser = process.env.TESTING_DEFAULT_USER as string

const checkElementExists = (locator: Locator): Promise<Locator> => pwExpect(locator).toHaveCount(1)

/* eslint-disable @typescript-eslint/restrict-plus-operands */

const RUNDB = (sql: string, params: any | any[] | Record<string, unknown>): execa.ExecaChildProcess<string> =>
  execa.command(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    'sqlite3 -batch' + " '" + process.env.SQLITE_DBPATH + "' " + '"' + SqlString.format(sql, params) + '"',
    {
      cleanup: true,
      shell: true,
    }
  )

const createLoginCookie = (browserContext: BrowserContext): Promise<void> =>
  browserContext.addCookies([
    {
      name: 'loggedInUser',
      value: process.env.TESTING_DEFAULT_USER as string,
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

const deleteTestUser = async (): Promise<void> => {
  await RUNDB('DELETE FROM users WHERE name = ?', testingDefaultUser)
}

const showWebPageErrorsInTerminal = (page: Page): void => {
  page.on('pageerror', (...args) => {
    console.error('🚨⚠️ Error Occured In Webpage ⚠️🚨')
    console.error(...args)
  })

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  page.on('console', async msg => {
    if (msg.type() !== 'error') return

    console.error('🚨⚠️ Error Occured In Webpage ⚠️🚨')

    const values: any[] = []

    // eslint-disable-next-line no-await-in-loop
    for (const arg of msg.args()) values.push(await arg.jsonValue())

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error(...values)
  })
}

export {
  checkElementExists,
  RUNDB,
  createLoginCookie,
  createTestUser,
  deleteTestUser,
  showWebPageErrorsInTerminal,
}
