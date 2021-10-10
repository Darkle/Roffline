import { cleanEnv as envVarChecker, str, port } from 'envalid'

import { startServer } from './server/server'
import { mainLogger } from './logging/logging'
import { db } from './db/db'
import { ensurePostsMediaDownloadFolderExists } from './server/utils'

envVarChecker(process.env, {
  PORT: port({ default: 8080 }), // eslint-disable-line @typescript-eslint/no-magic-numbers
  PUBLIC_FOLDER: str({ default: './frontend-build' }),
  LOGDIR: str({ default: './roffline-logs' }),
  POSTS_MEDIA_DOWNLOAD_DIR: str({ default: './posts-media' }),
  SQLITE_DBPATH: str({ default: './roffline-sqlite.db' }),
  COMMENTS_DBPATH: str({ default: './roffline-comments-lmdb.db' }),
  NODE_ENV: str({ choices: ['development', 'test', 'testing', 'production'] }),
  LOGGING_LEVEL: str({ choices: ['debug', 'error'], default: 'error' }),
  ADMIN_PASS: str({ default: 'foo' }),
})

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
