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
import fastifyCsrf from 'fastify-csrf'
import * as Eta from 'eta'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { isDev, getEnvFilePath } from './utils'
import cacheBust from './eta-plugins/eta-plugin-cachebust'
import { mainLogger } from '../logging/logging'
import { pageRoutes } from './routes/page-router'
// import { apiRoutes } from './routes/api-router'
// import { adminRoutes } from './routes/admin-router'
// import { adminApiRoutes } from './routes/admin-api-router'

const port = 3000

const postsMediaFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

Eta.configure({
  plugins: [cacheBust],
  cache: false,
})

const fastify = createFastify({
  logger: mainLogger,
  ignoreTrailingSlash: true,
  onProtoPoisoning: 'remove',
})

isDev && fastify.register(disableCache)
isDev && fastify.register(fastifyErrorPage)
fastify.register(fastifyFavicon, { path: './frontend/static/images', name: 'favicon.png' })
fastify.register(noAdditionalProperties)
fastify.register(fastifyCompress) // must come before fastifyStatic
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'frontend', 'static'),
  prefix: '/public/',
})
fastify.register(fastifyStatic, {
  root: postsMediaFolder,
  prefix: '/posts-media/',
  decorateReply: false, // the reply decorator has been added by the first fastifyStatic plugin registration
})
fastify.register(fastifyCookie)
fastify.register(fastifyUrlData)
fastify.register(templateManager, { engine: { eta: Eta }, viewExt: 'eta', root: path.join('server', 'views') })
fastify.register(fastifyCsrf)
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

fastify.setErrorHandler((err, _, reply) => {
  mainLogger.error(err)

  reply
    .code(HttpStatusCode.INTERNAL_SERVER_ERROR)
    .send(`${HttpStatusCode.INTERNAL_SERVER_ERROR} Internal Server Error`)
})

fastify.register(pageRoutes)
// fastify.register(apiRoutes, { prefix: '/api' })
// fastify.register(adminRoutes, { prefix: '/admin' })
// fastify.register(adminApiRoutes, { prefix: '/admin/api' })

const startServer = (): Promise<string> => fastify.listen(port, '0.0.0.0')

export { startServer }
