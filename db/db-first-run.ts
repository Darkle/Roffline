import { Connection } from 'typeorm'

function firstRun(connection: Connection): Connection {
  return connection
}

export { firstRun }
