import dnscache from 'dns-cache'

import { startServer } from './server/server'
import { mainLogger } from './logging/logging'
import { db } from './db/db'
import { ensurePostsMediaDownloadFolderExists } from './server/utils'
import { scheduleUpdates } from './downloads/update-scheduler'

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

  /*****
    Delay a little bit before exiting to allow the error to finish being written to log file in
    the mainLogger.fatal() and db.close() calls above to finish.
  *****/
  setImmediate(_ => process.exit(1))
}

process.on('unhandledRejection', bailOnFatalError)
process.on('uncaughtException', bailOnFatalError)

/*****
  We need to cache dns requests as we are sometimes making thousands of fetch requests
  in a short timespan. Without this we used to get error messages like:
  `FetchError: request to https://www.reddit.com/comments/qxy9ae.json failed, reason: getaddrinfo ENOTFOUND www.reddit.com`
*****/
const thirtyMinutesInMs = 1800000

dnscache(thirtyMinutesInMs)

db.init()
  .then(ensurePostsMediaDownloadFolderExists)
  .then(startServer)
  .then(scheduleUpdates)
  .catch(err => {
    console.error(err)
    mainLogger.fatal(err)
    process.exit(1)
  })
