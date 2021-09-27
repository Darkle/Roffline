/*****
  This file needs to be a commonjs (.cjs) file as we dont import this ourselves,
  pino auto imports it and expects it to be commonjs format.
*****/
const path = require('path')

const rotatingFileStream = require('rotating-file-stream')

const maxFiles = 5

/**
 * @param {{ outDir: string }}  options
 */
// eslint-disable-next-line functional/immutable-data
module.exports = function (options) {
  return rotatingFileStream.createStream(path.join(options.outDir, 'roffline.log'), {
    size: '5M',
    interval: '2d',
    maxFiles,
  })
}
