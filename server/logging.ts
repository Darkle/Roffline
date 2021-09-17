import Pino from 'pino'

import { isDev } from './utils'

const mainLogger = Pino({ name: 'roffline', level: isDev ? 'debug' : 'error', base: undefined })

// const fastifyLogger = mainLogger.child({ sublogger: 'fastify' })

const feedsLogger = mainLogger.child({ sublogger: 'feeds' })

const mediaDownloadsLogger = mainLogger.child({ sublogger: 'media-downloads' })

const dbLogger = mainLogger.child({ sublogger: 'db' })

mainLogger.debug('Hello From Main Logger')

feedsLogger.debug('Hello from feeds logger')

mediaDownloadsLogger.debug('Hello from media downloads logger')

dbLogger.debug('Hello from DB logger')

export { mainLogger, feedsLogger, mediaDownloadsLogger, dbLogger }
