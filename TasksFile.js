/* eslint-plugin-disable functional */
/* eslint-disable import/no-extraneous-dependencies, eslint-comments/disable-enable-pair */
import fs from 'node:fs'

import { cli, sh } from 'tasksfile'

const prepareAndCleanDir = dir => {
  if (fs.existsSync(dir)) fs.rmdirSync(dir, { recursive: true })
  fs.mkdirSync(dir)
}

/*****
  You can run any of these tasks manually like this: npx task tests:npmaudit
*****/

const dev = {
  start() {
    const browserync = `browser-sync start --watch --reload-delay 1500 --no-open --no-notify --no-ui --no-ghost-mode --no-inject-changes --files=./frontend/**/* --files=./server/**/* --files=./boot.js --ignore=node_modules --port 8081 --proxy 'localhost:8080' --host '0.0.0.0'`
    const nodemon = `nodemon ./boot.js --watch server --ext js,njk`
    sh(`concurrently "${nodemon}" "${browserync}"`)
  },
  inspect() {
    sh(`node --inspect ./boot.js`)
  },
}

cli({
  dev,
  tests,
  db,
  dbquickclear1,
  build,
  testAll,
  buildAll,
})
