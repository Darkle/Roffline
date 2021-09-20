import fs from 'node:fs'

import { createConnection, getConnection, Connection } from 'typeorm'

import { models } from './models/index'
import { firstRun } from './db-first-run'

const threeSecondsInMS = 3000
const dbPath = process.env['DBPATH'] || './roffline-storage.db'
const dbFileDoesNotExist = !fs.statSync(dbPath, { throwIfNoEntry: false })

const db = {
  connection: getConnection,
  init(): Promise<Connection> {
    return createConnection({
      type: 'sqlite',
      database: dbPath,
      entities: [...models],
      logging: false, //If set to true then query and error logging will be enabled.
      maxQueryExecutionTime: threeSecondsInMS,
      synchronize: dbFileDoesNotExist,
    }).then(firstRun)
  },
  close(): Promise<void> {
    return db.connection().close()
  },
}

export { db }
