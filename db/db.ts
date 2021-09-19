import { createConnection, getConnection, Connection } from 'typeorm'

import { models } from './models/index'
import { firstRun } from './db-first-run'

const threeSecondsInMS = 3000

const db = {
  connection: getConnection,
  init(): Promise<Connection> {
    return createConnection({
      type: 'sqlite',
      database: process.env['DBPATH'] ? process.env['DBPATH'] : './roffline-storage.db',
      entities: [...models],
      logging: false, //If set to true then query and error logging will be enabled.
      maxQueryExecutionTime: threeSecondsInMS,
    }).then(firstRun)
  },
  close(): Promise<void> {
    return db.connection().close()
  },
}

export { db }
