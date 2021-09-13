import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import createFastify from 'fastify'
// @ts-expect-error no types available for fastify-disablecache
import disableCache from 'fastify-disablecache'
// @ts-expect-error no types available for fastify-error-page
import fastifyErrorPage from 'fastify-error-page'
import fastifyFavicon from 'fastify-favicon'
// @ts-expect-error no types available for fastify-no-additional-properties
import noAdditionalProperties from 'fastify-no-additional-properties'
import fastifyCompress from 'fastify-compress'
import fastifyStatic from 'fastify-static'
import fastifyUrlData from 'fastify-url-data'
import templateManager from 'point-of-view'
import helmet from 'fastify-helmet'
import fastifyCookie from 'fastify-cookie'
import fastifyCsrf from 'fastify-csrf'
// @ts-expect-error no types available for nunjucks
import nunjucks from 'nunjucks'

import { isDev } from './utils'

// type unused = unknown

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const port = 3000

const fastify = createFastify({ logger: isDev() })

isDev() && fastify.register(disableCache)
isDev() && fastify.register(fastifyErrorPage)
fastify.register(fastifyFavicon, { path: './frontend/static/images', name: 'favicon.png' })
fastify.register(noAdditionalProperties)
fastify.register(fastifyCompress) // must come before fastifyStatic
console.log(process.cwd())
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'frontend', 'static'),
})
fastify.register(fastifyUrlData)
fastify.register(templateManager, {
  engine: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nunjucks,
  },
})
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
  reply.view('server/views/index.njk', { foo: 'Hello from template' })
})
// fastify.get('/', (request, reply) => reply.send({ hello: 'world' }))

// eslint-disable-next-line functional/functional-parameters
const startServer = (): Promise<string> => fastify.listen(port)

export { startServer }
