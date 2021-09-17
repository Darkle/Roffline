/* eslint-disable import/first, eslint-comments/disable-enable-pair */
import dotenv from 'dotenv'
dotenv.config() // this needs to be first
import { cleanEnv as envVarChecker, str, port } from 'envalid'

import { mainLogger, feedsLogger, mediaDownloadsLogger, dbLogger } from './server/logging'
import { startServer } from './server/server'
mainLogger.debug('Hello From Main Logger')

feedsLogger.debug('Hello from feeds logger')

mediaDownloadsLogger.debug('Hello from media downloads logger')

dbLogger.debug('Hello from DB logger')
envVarChecker(process.env, {
  PORT: port({ default: 8080 }), // eslint-disable-line @typescript-eslint/no-magic-numbers
  PUBLIC_FOLDER: str({ default: './frontend-build' }),
  LOGDIR: str({ default: './roffline-logs' }),
  POSTS_MEDIA_DOWNLOAD_DIR: str({ default: './posts-media' }),
  DBPATH: str({ default: './roffline-storage.db' }),
  NODE_ENV: str({ choices: ['development', 'test', 'testing', 'production'] }),
})

// const twoSecondsInMs = 2000

// function bailOnFatalError(err) {
//   console.error(err)
//   logger.error('bailOnFatalError', err)

//   // eslint-disable-next-line functional/no-try-statement
//   try {
//     db.close(RA.noop)
//   } catch (error) {}

//   /*****
//     Delay a little bit before exiting to allow the error to finish being written to log file in
//     the logger.error() and db.close() call above to finish.
//   *****/
//   setTimeout(_ => process.exit(1), twoSecondsInMs)
// }

// process.on('unhandledRejection', bailOnFatalError)
// process.on('uncaughtException', bailOnFatalError)

// db.init()
//   .then(scheduleUpdates)
//   .then(regularlyTrimReddit429Responses)
//   .then(startServer)
//   .catch(err => {
//     console.error(err)
//     process.exit(1)
//   })
startServer().catch(err => {
  console.error(err)
  process.exit(1)
})
