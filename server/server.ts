import path from 'path'

import createFastify from 'fastify'
import disableCache from 'fastify-disablecache'
import fastifyErrorPage from 'fastify-error-page'
import fastifyFavicon from 'fastify-favicon'
import noAdditionalProperties from 'fastify-no-additional-properties'
import fastifyCompress from 'fastify-compress'
import fastifyStatic from 'fastify-static'
import fastifyUrlData from 'fastify-url-data'
import templateManager from 'point-of-view'
import helmet from 'fastify-helmet'
import fastifyCookie from 'fastify-cookie'
import fastifyFormbody from 'fastify-formbody'
import nunjucks from 'nunjucks'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'
import fastifyRequestLogger from '@mgcrea/fastify-request-logger'
import prettifier from '@mgcrea/pino-pretty-compact'

import { isDev, getEnvFilePath } from './utils'
import { browserSyncReminderForDev, fastifyDevlogIgnore, mainLogger } from '../logging/logging'
import { pageRoutes } from './routes/page-router'
import { apiRoutes } from './routes/api-router'
// import { adminRoutes } from './routes/admin-router'
// import { adminApiRoutes } from './routes/admin-api-router'

const port = 3000

const postsMediaFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

const fastify = createFastify({
  logger: {
    prettyPrint: isDev,
    prettifier,
    level: isDev ? 'info' : 'error',
  },
  disableRequestLogging: true,
  ignoreTrailingSlash: true,
  onProtoPoisoning: 'remove',
})

isDev && fastify.register(fastifyRequestLogger, fastifyDevlogIgnore)
isDev && fastify.register(disableCache)
isDev && fastify.register(fastifyErrorPage)
fastify.register(fastifyFormbody)
fastify.register(fastifyFavicon, { path: './frontend/static/images', name: 'favicon.png' })
fastify.register(noAdditionalProperties)
fastify.register(fastifyCompress) // must come before fastifyStatic
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'frontend'),
})
fastify.register(fastifyStatic, {
  root: postsMediaFolder,
  prefix: '/posts-media/',
  decorateReply: false, // the reply decorator has been added by the first fastifyStatic plugin registration
})
fastify.register(fastifyCookie)
fastify.register(fastifyUrlData)
fastify.register(templateManager, {
  engine: { nunjucks },
  viewExt: 'njk',
  root: path.join(process.cwd(), 'server', 'views'),
  options: {
    tags: {
      variableStart: '<#',
      variableEnd: '#>',
    },
  },
})
fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval is for alpine.js library.
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
})

fastify.setSchemaErrorFormatter((errors): Error => {
  mainLogger.error(errors)

  return new Error(errors.toString())
})

fastify.setErrorHandler((err, _, reply) => {
  mainLogger.error(err)

  reply
    .code(HttpStatusCode.INTERNAL_SERVER_ERROR)
    .send(`${HttpStatusCode.INTERNAL_SERVER_ERROR} Internal Server Error`)
})

fastify.register(pageRoutes)
fastify.register(apiRoutes, { prefix: '/api' })
// fastify.register(adminRoutes, { prefix: '/admin' })
// fastify.register(adminApiRoutes, { prefix: '/admin/api' })

const startServer = (): Promise<string | void> => fastify.listen(port, '0.0.0.0').then(browserSyncReminderForDev)

export { startServer }
