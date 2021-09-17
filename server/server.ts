import path from 'node:path'

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

import { isDev, getEnvFilePath } from './utils'

// type unused = unknown

const port = 3000

const postsMediaFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

const fastify = createFastify({
  logger: isDev ? { prettyPrint: true } : false,
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
  decorateReply: false, // the reply decorator has been added by the first plugin registration
})
fastify.register(fastifyUrlData)
fastify.register(templateManager, { engine: { eta: Eta } })
fastify.register(fastifyCookie)
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

// fastify.get('/', async (_, __) => ({ hello: 'world' }))
fastify.get('/', (_, reply) => {
  reply.view('server/views/index.eta', { foo: 'Hello from template' })
})
// fastify.get('/', (request, reply) => reply.send({ hello: 'world' }))

// eslint-disable-next-line functional/functional-parameters
const startServer = (): Promise<string> => fastify.listen(port, '0.0.0.0')

export { startServer }
