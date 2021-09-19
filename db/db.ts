import path from 'node:path'

import { createConnection, getConnection, Connection } from 'typeorm'

import { firstRun } from './db-first-run'

const db = {
  connection: getConnection,
  init(): Promise<Connection> {
    return createConnection({
      type: 'sqlite',
      database: process.env['DBPATH'] ? process.env['DBPATH'] : './roffline-storage.db',
      entities: [path.join(process.cwd(), 'db', '/models/*.js')],
      synchronize: true,
      logging: false,
    }).then(firstRun)
  },
}

export { db }
