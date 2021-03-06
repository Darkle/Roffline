const path = require('path')

const dontEnvPath = process.env.TESTING
  ? path.join(process.cwd(), 'tests', '.testing.env')
  : path.join(process.cwd(), '.env')

const dotEnv = require('dotenv').config({ path: dontEnvPath })

const { cleanEnv: envVarChecker, str, port, url } = require('envalid')

/*****
  If dotEnv.parsed is empty then we are in docker and .env file is empty and the env vars have
  allready been set with the --env-file flag.
*****/
const envVars = Object.keys(dotEnv.parsed).length === 0 ? process.env : dotEnv.parsed

const checkendEnvVars = envVarChecker(envVars, {
  PORT: port({ default: 8080 }),
  PUBLIC_FOLDER: str({ default: './frontend-build' }),
  LOGDIR: str({ default: './rl-data/roffline-logs' }),
  POSTS_MEDIA_DOWNLOAD_DIR: str({ default: './rl-data/posts-media' }),
  SQLITE_DBPATH: str({ default: './rl-data/roffline-sqlite.db' }),
  COMMENTS_DBPATH: str({ default: './rl-data/roffline-comments-lmdb.db' }),
  NODE_ENV: str({ choices: ['development', 'test', 'testing', 'production'], default: 'production' }),
  LOGGING_LEVEL: str({ choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'], default: 'error' }),
  ADMIN_PASS: str({ default: 'foo' }),
  OFFLINE_CHECK_URL: url({ default: 'https://www.google.com/' }),
})

process.env.PORT = checkendEnvVars.PORT.toString()
process.env.PUBLIC_FOLDER = checkendEnvVars.PUBLIC_FOLDER
process.env.LOGDIR = checkendEnvVars.LOGDIR
process.env.POSTS_MEDIA_DOWNLOAD_DIR = checkendEnvVars.POSTS_MEDIA_DOWNLOAD_DIR
process.env.SQLITE_DBPATH = checkendEnvVars.SQLITE_DBPATH
process.env.COMMENTS_DBPATH = checkendEnvVars.COMMENTS_DBPATH
process.env.NODE_ENV = checkendEnvVars.NODE_ENV
process.env.LOGGING_LEVEL = checkendEnvVars.LOGGING_LEVEL
process.env.ADMIN_PASS = checkendEnvVars.ADMIN_PASS
process.env.OFFLINE_CHECK_URL = checkendEnvVars.OFFLINE_CHECK_URL

/*****
  I dont know why, but when this file is called with nodemon, something sets NODE_ENV
  to production (which we dont want in dev), so just added an ISDEV env var, set when
  call nodemon.
*****/
if (process.env.ISDEV) {
  process.env.NODE_ENV = 'development'
}
