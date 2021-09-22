/* eslint-plugin-disable functional */
/* eslint-disable import/no-extraneous-dependencies, eslint-comments/disable-enable-pair, max-lines-per-function */
import fs from 'node:fs'
import path from 'node:path'

import { cli, sh } from 'tasksfile'
import clc from 'cli-color'
import esbuild from 'esbuild'

const shellOptions = { nopipe: true, async: undefined }

const prepareAndCleanDir = dir => {
  if (fs.existsSync(dir)) fs.rmdirSync(dir, { recursive: true })
  fs.mkdirSync(dir)
}

const pDelay = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

const noop = _ => {}

/*****
  You can run any of these tasks manually like this: npx task tests:npmaudit
*****/

const dev = {
  start() {
    const browserync = `browser-sync start --watch --reload-delay 1500 --no-open --no-notify --no-ui --no-ghost-mode --no-inject-changes --files=./frontend/**/* --files=./server/**/* --files=./boot.js --ignore=node_modules --port 8081 --proxy '127.0.0.1:3000' --host '0.0.0.0'`
    const nodemon = `nodemon ./boot.js --watch server --ext js,njk,eta`
    sh(`concurrently --raw --prefix=none "${nodemon}" "${browserync}"`, shellOptions)
  },
  inspect() {
    sh(`node --inspect ./boot.js`, shellOptions)
  },
}

const build = {
  copyToBuild() {
    prepareAndCleanDir('./frontend-build')
    sh(`ncp ./frontend/static "./frontend-build/static"`, shellOptions)
  },
  minifyCSS() {
    sh(`foreach --glob "frontend-build/**/*.css" --execute "csso --input #{path} --output #{path}"`, shellOptions)
  },
  minifyJS() {
    esbuild
      .build({
        entryPoints: ['app.jsx'],
        bundle: true,
        format: 'esm',
        minify: true,
        outdir: path.join('frontend-build', 'js'),
        target: ['Firefox78', 'Chrome90', 'Safari14', 'iOS14'],
      })
      .catch(() => process.exit(1))
  },
}

const tests = {
  npmaudit() {
    sh('npm audit --production', shellOptions)
  },
  snyk() {
    sh('snyk test --production', shellOptions)
  },
  csslint() {
    sh(`stylelint "frontend/css/**/*.css"`, shellOptions)
  },
  eslint() {
    sh(
      `eslint './boot.ts' './server/**/*.ts' './server/**/*.eta' './frontend/js/**/*.ts' './tests/**/*.ts' --report-unused-disable-directives --quiet --rule 'no-console: ["error", { allow: ["error", "info"] }]' --rule "no-warning-comments: ['error', { terms: ['todo', 'fixme', 'hack', 'bug', 'xxx'], location: 'anywhere' }]"`,
      shellOptions
    )
  },
  tslint() {
    sh(`ttsc --noEmit`, shellOptions)
  },
  checkmyheaders() {
    const prodEnvs = `NODE_ENV=production PUBLIC_FOLDER=frontend-build POSTS_MEDIA_DOWNLOAD_DIR='./posts-media' LOGDIR='./roffline-logs'`
    sh(
      `${prodEnvs} concurrently "node ./boot.js" "sleep 3 && check-my-headers http://0.0.0.0:8080 && exit 0" --kill-others`,
      shellOptions
    )
  },
  sonarqube() {
    // You need a SONAR_TOKEN env varible set for this to work. You can get one from https://sonarcloud.io/
    sh(
      `sonar-scanner -Dsonar.organization=darkle -Dsonar.projectKey=Roffline -Dsonar.sources=. -Dsonar.host.url=https://sonarcloud.io -Dsonar.exclusions=frontend/static/**/*`,
      shellOptions
    )
    /*****
      Locally hosted sonarqube.
    *****/
    // sh(
    //   `sonar-scanner -Dsonar.organization=coopcoding -Dsonar.projectKey=Roffline -Dsonar.sources=. -Dsonar.host.url=http://192.168.1.8:3212 -Dsonar.exclusions=frontend/static/**/* -Dsonar.login=dbfabd25caf1bb3bd0871912679e1531922679ff`,
    //   shellOptions
    // )
  },
  bundlesize() {
    console.log(clc.blue.bold('Vendor Libs Size Check:'))
    sh(`bundlesize -f 'frontend-build/static/vendor/js/**/*.js' -s 35kB`, shellOptions)
    sh(`ncat 'frontend-build/**/*.js' -o ./total-bundle.js > /dev/null`, shellOptions) // Concatenate all frontend js to a single file
    console.log(clc.blue.bold('Total JS Size Check:'))
    sh(`bundlesize -f ./total-bundle.js -s 70kB`, shellOptions)
    fs.unlinkSync('./total-bundle.js')
  },
  webhint() {
    Object.keys(build).forEach(key => build[key]()) //get frontend-build set up
    const prodEnvs = `NODE_ENV=production PUBLIC_FOLDER=frontend-build POSTS_MEDIA_DOWNLOAD_DIR='./posts-media' LOGDIR='./roffline-logs'`
    const chromePathEnv = `PUPPETEER_EXECUTABLE_PATH="$(command -v google-chrome || command -v chrome || command -v chromium || command -v chromium-browser)"`
    const randomPostId = sh(
      'sqlite3 -batch roffline-storage.db "SELECT id FROM posts ORDER BY RANDOM() LIMIT 1;"',
      { ...shellOptions, silent: true }
    )?.trim()

    sh(`${prodEnvs} node ./boot.js &`, shellOptions)
    sh(
      `sleep 3 && ${chromePathEnv} multiview [ hint http://0.0.0.0:8080 ] [ hint http://0.0.0.0:8080/search ] [ hint http://0.0.0.0:8080/settings ] [ hint http://0.0.0.0:8080/help ] [ hint http://0.0.0.0:8080/post/${randomPostId} ] --print --autoexit 1000`,
      {
        ...shellOptions,
        async: true,
      }
    )
      .catch(noop)
      .finally(_ => sh(`fkill :8080 --silent`, shellOptions))
  },
  lighthouse() {
    Object.keys(build).forEach(key => build[key]()) //get frontend-build set up
    const prodEnvs = `NODE_ENV=production PUBLIC_FOLDER=frontend-build POSTS_MEDIA_DOWNLOAD_DIR='./posts-media' LOGDIR='./roffline-logs'`

    const shOptions = { nopipe: true, async: true }
    const randomPostId = sh(
      'sqlite3 -batch roffline-storage.db "SELECT id FROM posts ORDER BY RANDOM() LIMIT 1;"',
      { ...shellOptions, silent: true }
    )?.trim()

    fs.mkdirSync(path.join(process.cwd(), 'lighthouse-reports'))

    sh(`${prodEnvs} node ./boot.js &`, shellOptions)
    // @ts-expect-error
    sh(`sleep 3`, shOptions)
      .then(_ =>
        Promise.all([
          sh(
            `lighthouse http://0.0.0.0:8080 --chrome-flags="--headless" --output-path ./lighthouse-reports/lighthouse-report1.html --view`,
            // @ts-expect-error
            shOptions
          ),
          sh(
            `lighthouse http://0.0.0.0:8080/search --chrome-flags="--headless" --output-path ./lighthouse-reports/lighthouse-report2.html --view`,
            // @ts-expect-error
            shOptions
          ),
          sh(
            `lighthouse http://0.0.0.0:8080/settings --chrome-flags="--headless" --output-path ./lighthouse-reports/lighthouse-report3.html --view`,
            // @ts-expect-error
            shOptions
          ),
          sh(
            `lighthouse http://0.0.0.0:8080/help --chrome-flags="--headless" --output-path ./lighthouse-reports/lighthouse-report4.html --view`,
            // @ts-expect-error
            shOptions
          ),
          sh(
            `lighthouse http://0.0.0.0:8080/post/${randomPostId} --chrome-flags="--headless" --output-path ./lighthouse-reports/lighthouse-report5.html --view`,
            // @ts-expect-error
            shOptions
          ),
        ])
      )
      .catch(noop)
      .finally(_ =>
        Promise.all([
          pDelay(1000).then(() =>
            fs.promises.rmdir(path.join(process.cwd(), 'lighthouse-reports'), { recursive: true })
          ),
          // @ts-expect-error
          sh(`fkill :8080 --silent`, shOptions),
        ]).catch(err => console.error(err))
      )
  },
  mocha(options, skipVideoTests = false) {
    //INFO: if using a test.env file, remember that in package.json we are pre-requireing dotenv, so double check package.json <<<<<<<<<<
    const testEnvs = `NODE_ENV=production PUBLIC_FOLDER=frontend-build POSTS_MEDIA_DOWNLOAD_DIR='./test-posts-media' LOGDIR='./roffline-logs' DBPATH='./test-roffline-storage.db'`
    const shOptions = { ...shellOptions, async: true }

    Object.keys(build).forEach(key => build[key]()) //get frontend-build set up

    sh(
      `${testEnvs} mocha --recursive tests --ignore tests/__mocks --ignore tests/seed-data ${
        skipVideoTests ? '--ignore tests/unit/server/updates/download-video.test.js' : ''
      } --recursive --bail --extension .test.js --require tests/hooks.js --exit --diff=off`,
      // @ts-expect-error
      shOptions
    )
      .catch(noop)
      .finally(_ =>
        // @ts-expect-error
        sh(`fkill :8080 --silent`, { silent: true, ...shOptions })
          .catch(noop)
          .finally(() => process.exit(0))
      )
  },
  // skip downloadVideo tests as they can take 5-10 mins
  mochaSansVideoTests(options) {
    const skipVideoTests = true
    tests.mocha(options, skipVideoTests)
  },
}

const db = {
  createDBTables() {
    const dbPath = process.env.DBPATH || './roffline-storage.db'
    const dbFileDoesNotExist = !fs.statSync(dbPath, { throwIfNoEntry: false })

    dbFileDoesNotExist && sh(`sqlite3 ${dbPath} < ./db/init.sql`)
  },
  // clearsubstables() {
  //   const queryForAllSubsTruncate = sh(
  //     `sqlite3 -batch roffline-storage.db "SELECT name FROM sqlite_master WHERE type ='table' AND name != 'posts' AND name != 'subreddits' AND name != 'updates_tracker' AND name != 'http429s' ;"`,
  //     {
  //       transform: str => `DELETE FROM ${str};`,
  //       silent: true,
  //     }
  //   ).trim()

  //   sh(`sqlite3 -batch roffline-storage.db "BEGIN;${queryForAllSubsTruncate}COMMIT;"`)
  // },
  clearpoststable() {
    sh('sqlite3 -batch roffline-storage.db "DELETE FROM posts;"')
  },
  removeComments() {
    sh('sqlite3 -batch roffline-storage.db "UPDATE posts SET comments = NULL;"')
  },
  clearDownloadMetaData() {
    sh(
      'sqlite3 -batch roffline-storage.db "UPDATE posts SET media_has_been_downloaded = 0; UPDATE posts SET mediaDownloadTries = 0;"'
    )
  },
  setDownloadedFilesMetaData() {
    sh(
      'sqlite3 -batch roffline-storage.db "UPDATE posts SET media_has_been_downloaded = 1; UPDATE posts SET mediaDownloadTries = 1;"'
    )
  },
}

const dbquickclear1 = () => {
  db.clearsubstables()
  db.clearpoststable()
}

const buildProd = () => Object.keys(build).forEach(key => build[key]())

const testAll = () => {
  buildProd()
  Object.keys(tests).forEach(key => tests[key]())
}

cli({
  dev,
  tests,
  db,
  dbquickclear1,
  testAll,
  buildProd,
})
