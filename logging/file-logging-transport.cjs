/*****
  This file needs to be a commonjs (.cjs) file as we dont import this ourselves,
  pino auto imports it and expects it to be commonjs format.
*****/
const path = require('path')

const rotatingFileStream = require('rotating-file-stream')

const maxFiles = 5

const pad = num => (num > 9 ? '' : '0') + num

const logFilenameGenerator = (time, index) => {
  // eslint-disable-next-line functional/no-conditional-statement,no-param-reassign
  if (!time) time = new Date()
  // eslint-disable-next-line functional/no-conditional-statement,no-param-reassign
  if (!index) index = 0

  const month = `${time.getFullYear()}${pad(time.getMonth() + 1)}`
  const day = pad(time.getDate())
  const hour = pad(time.getHours())
  const minute = pad(time.getMinutes())

  return `${month}${day}-${hour}${minute}-${index}-roffline.log`
}

/**
 * @param {{ outDir: string }}  options
 */
// eslint-disable-next-line functional/immutable-data
module.exports = function (options) {
  return rotatingFileStream.createStream(logFilenameGenerator, {
    size: '3M',
    interval: '2d',
    maxFiles,
    path: options.outDir,
  })
}
