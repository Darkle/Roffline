import Pino, { pino } from 'pino'
import { formatISO } from 'date-fns'

import { getEnvFilePath } from '../server/utils'

const pinoOptions = {
  name: 'roffline',
  level: process.env['LOGGING_LEVEL'],
  base: undefined,
  timestamp(): string {
    return `,"time":"${formatISO(new Date(), { representation: 'complete' })}"`
  },
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
      target: './file-logging-transport.cjs',
      options: { outDir: getEnvFilePath(process.env['LOGDIR']) },
    },
  ],
})

const mainLogger = Pino(pinoOptions, transports)

const feedsLogger = mainLogger.child({ sublogger: 'feeds' })

const mediaDownloadsLogger = mainLogger.child({ sublogger: 'media-downloads' })

const dbLogger = mainLogger.child({ sublogger: 'db' })

export { mainLogger, feedsLogger, mediaDownloadsLogger, dbLogger }
