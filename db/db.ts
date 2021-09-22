import fs from 'node:fs'

import { createConnection, getConnection, UpdateResult } from 'typeorm'

import { UpdatesTracker } from './entities/UpdatesTracker'
import { Entities } from './entities/index'
import { firstRun } from './db-first-run'

const threeSecondsInMS = 3000
const dbPath = process.env['DBPATH'] || './roffline-storage.db'
const dbFileDoesNotExist = !fs.statSync(dbPath, { throwIfNoEntry: false })

const db = {
  init(): Promise<void> {
    return createConnection({
      type: 'sqlite',
      database: dbPath,
      entities: [...Entities],
      logging: false, //If set to true then query and error logging will be enabled.
      maxQueryExecutionTime: threeSecondsInMS,
      synchronize: dbFileDoesNotExist,
    }).then(firstRun)
  },
  close(): Promise<void> {
    return getConnection().close()
  },
  getLastScheduledUpdateTime(): Promise<void | string> {
    return UpdatesTracker.findOne(1).then(res => res?.lastUpdateDateAsString)
  },
  setLastScheduledUpdateTime(date: string | Date): Promise<UpdateResult> {
    const dateAsString = typeof date === 'string' ? date : date.toString()

    return UpdatesTracker.update(1, { lastUpdateDateAsString: dateAsString })
  },
}

export { db }

// setTimeout(() => {
//   db.getLastScheduledUpdateTime()
//     .then(res => {
//       console.log(res)
//       return db.setLastScheduledUpdateTime(new Date())
//     })
//     .then(() =>
//       db.getLastScheduledUpdateTime().then(res => {
//         console.log(res)
//       })
//     )
// }, 3000) // eslint-disable-line @typescript-eslint/no-magic-numbers
