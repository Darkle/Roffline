import dnscache from 'dns-cache'
import R from 'ramda'
import RA from 'ramda-adjunct'

import { startServer } from './server/server'
import { mainLogger } from './logging/logging'
import { db } from './db/db'
import { ensurePostsMediaDownloadFolderExists } from './server/utils'
import { scheduleUpdates } from './downloads/update-scheduler'

function bailOnFatalError(err: Error): void {
  console.error(err)

  R.tryCatch(db.close, RA.noop)()

  R.tryCatch(mainLogger.fatal, RA.noop)(err)

  /*****
    Wait for file IO from the mainLogger.fatal() and db.close() calls above to finish.
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
