import { expect as pwExpect } from '@playwright/test'
import execa from 'execa'
import type { Locator } from '@playwright/test'
import SqlString from 'sqlstring'

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

export { checkElementExists, RUNDB }
