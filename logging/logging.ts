import { FastifyRequest } from 'fastify'
import Pino, { pino } from 'pino'
import { DateTime } from 'luxon'
import cliColor from 'cli-color'

import { getEnvFilePath, isDev } from '../server/utils'

const pinoOptions = {
  name: 'roffline',
  level: process.env['LOGGING_LEVEL'],
  base: undefined,
  timestamp(): string {
    return `,"time":"${DateTime.now().toISO({ includeOffset: true })}"`
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

const pathStartersToIgnoreInDev = ['/css/', '/js/', '/static/', '/posts-media/']

const fastifyDevlogIgnore = {
  ignore(request: FastifyRequest): boolean {
    return pathStartersToIgnoreInDev.some(pathStarter => request.url.startsWith(pathStarter))
  },
}

const browserSyncReminderForDev = (): void => {
  // eslint-disable-next-line functional/no-conditional-statement
  if (isDev) {
    console.log(cliColor.white.bold(`Browsersync Url: ${cliColor.white.underline('http://0.0.0.0:8081')}`))
  }
}

const mainLogger = Pino(pinoOptions, transports)

const feedsLogger = mainLogger.child({ sublogger: 'feeds' })

const mediaDownloadsLogger = mainLogger.child({ sublogger: 'media-downloads' })

const dbLogger = mainLogger.child({ sublogger: 'db' })

export { mainLogger, feedsLogger, mediaDownloadsLogger, dbLogger, fastifyDevlogIgnore, browserSyncReminderForDev }
