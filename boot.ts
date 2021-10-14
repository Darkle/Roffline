import { startServer } from './server/server'
import { mainLogger } from './logging/logging'
import { db } from './db/db'
import { ensurePostsMediaDownloadFolderExists } from './server/utils'

function bailOnFatalError(err: Error): void {
  console.error(err)
  // eslint-disable-next-line functional/no-try-statement
  try {
    db.close()
  } catch (error) {}

  // eslint-disable-next-line functional/no-try-statement
  try {
    mainLogger.fatal(err)
  } catch (error) {}

  const twoSecondsInMs = 2000
  /*****
    Delay a little bit before exiting to allow the error to finish being written to log file in
    the mainLogger.fatal() and db.close() calls above to finish.
  *****/
  setTimeout(_ => process.exit(1), twoSecondsInMs)
}

process.on('unhandledRejection', bailOnFatalError)
process.on('uncaughtException', bailOnFatalError)

db.init()
  .then(ensurePostsMediaDownloadFolderExists)
  .then(startServer)
  .catch(err => {
    console.error(err)
    mainLogger.fatal(err)
    process.exit(1)
  })
