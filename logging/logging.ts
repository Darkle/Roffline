import type { FastifyRequest } from 'fastify'
import Pino from 'pino'
import type { pino } from 'pino'
import { DateTime } from 'luxon'

import { getEnvFilePath } from '../server/utils'

const pinoOptions = {
  name: 'roffline',
  level: process.env['LOGGING_LEVEL'],
  base: undefined,
  timestamp(): string {
    return `,"time":"${DateTime.now().toISO({ includeOffset: true })}"`
  },
  hooks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logMethod(inputArgs: any[], method: Pino.LogFn): void {
      /*****
        Pino expects an object first, then an optional string message. We want that reversed so
        that we can pass in the string message first and the object second.
      *****/
      // eslint-disable-next-line functional/no-conditional-statement
      if (typeof inputArgs[0] === 'string' && typeof inputArgs[1] === 'object') {
        // eslint-disable-next-line functional/immutable-data
        const arg1 = inputArgs.shift() as string
        // eslint-disable-next-line functional/immutable-data
        const arg2 = inputArgs.shift() as Record<string, unknown>
        // @ts-expect-error I'm not sure why this is erroring, this code is copied from the docs: https://getpino.io/#/docs/api?id=logmethod
        return method.apply(this, [arg2, arg1, ...inputArgs]) // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      }

      // @ts-expect-error I'm not sure why this is erroring, this code is copied from the docs: https://getpino.io/#/docs/api?id=logmethod
      return method.apply(this, inputArgs)
    },
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

/*****
  Cant do much about it being `any` as it is typed that way: https://github.com/pinojs/pino/blob/ec9b0b528ab888b8e00233cf613f09fc82492244/pino.d.ts#L31
*****/
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const mainLogger = Pino(pinoOptions, transports)

const feedsLogger = mainLogger.child({ sublogger: 'feeds' })

const commentsDownloadsLogger = mainLogger.child({ sublogger: 'comments-downloads' })

const mediaDownloadsLogger = mainLogger.child({ sublogger: 'media-downloads' })

const dbLogger = mainLogger.child({ sublogger: 'db' })

export { mainLogger, feedsLogger, mediaDownloadsLogger, dbLogger, fastifyDevlogIgnore, commentsDownloadsLogger }
