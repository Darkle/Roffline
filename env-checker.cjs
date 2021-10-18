require('dotenv').config()
const { cleanEnv: envVarChecker, str, port } = require('envalid')

const checkendEnvVars = envVarChecker(process.env, {
  PORT: port({ default: 8080 }),
  PUBLIC_FOLDER: str({ default: './frontend-build' }),
  LOGDIR: str({ default: './roffline-logs' }),
  POSTS_MEDIA_DOWNLOAD_DIR: str({ default: './posts-media' }),
  SQLITE_DBPATH: str({ default: './roffline-sqlite.db' }),
  COMMENTS_DBPATH: str({ default: './roffline-comments-lmdb.db' }),
  NODE_ENV: str({ choices: ['development', 'test', 'testing', 'production'], default: 'production' }),
  LOGGING_LEVEL: str({ choices: ['debug', 'error'], default: 'error' }),
  ADMIN_PASS: str({ default: 'foo' }),
})

/* eslint-disable functional/immutable-data */

process.env.PORT = checkendEnvVars.PORT.toString()
process.env.PUBLIC_FOLDER = checkendEnvVars.PUBLIC_FOLDER
process.env.LOGDIR = checkendEnvVars.LOGDIR
process.env.POSTS_MEDIA_DOWNLOAD_DIR = checkendEnvVars.POSTS_MEDIA_DOWNLOAD_DIR
process.env.SQLITE_DBPATH = checkendEnvVars.SQLITE_DBPATH
process.env.COMMENTS_DBPATH = checkendEnvVars.COMMENTS_DBPATH
process.env.NODE_ENV = checkendEnvVars.NODE_ENV
process.env.LOGGING_LEVEL = checkendEnvVars.LOGGING_LEVEL
process.env.ADMIN_PASS = checkendEnvVars.ADMIN_PASS

/* eslint-enable functional/immutable-data */
