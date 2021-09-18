// import { Writable } from 'node:stream'
import Pino, { pino } from 'pino'

const pinoOptions = {
  name: 'roffline',
  level: process.env['LOGGING_LEVEL'],
  base: undefined,
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const transports = Pino.transport({
  targets: [
    {
      level: process.env['LOGGING_LEVEL'] as pino.Level,
      target: 'pino-pretty',
      options: { destination: 1 },
    },
    {
      level: process.env['LOGGING_LEVEL'] as pino.Level,
      target: './file-logging-transport.js',
      options: { outDir: process.env['LOGDIR'] },
    },
  ],
})

const mainLogger = Pino(pinoOptions, transports)
mainLogger.debug('hello')
mainLogger.error(new Error('this is an error'))

const feedsLogger = mainLogger.child({ sublogger: 'feeds' })

const mediaDownloadsLogger = mainLogger.child({ sublogger: 'media-downloads' })

const dbLogger = mainLogger.child({ sublogger: 'db' })

export { mainLogger, feedsLogger, mediaDownloadsLogger, dbLogger }
