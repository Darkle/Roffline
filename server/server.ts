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
// @ts-expect-error no types available for nunjucks
import nunjucks from 'nunjucks'

import { isDev } from './utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const port = 3000
// type unused = unknown

const fastify = createFastify({ logger: isDev() })

isDev() && fastify.register(disableCache)
isDev() && fastify.register(fastifyErrorPage)
fastify.register(fastifyFavicon, { path: './test', name: 'icon.ico' })
fastify.register(noAdditionalProperties)
fastify.register(fastifyCompress) // must come before fastifyStatic
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'frontend', 'vendor'),
  prefix: '/public/',
})
fastify.register(fastifyUrlData)
fastify.register(templateManager, {
  engine: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nunjucks,
  },
})

// Declare a route
// fastify.get('/', async (_, __) => ({ hello: 'world' }))
fastify.get('/', (_, reply) => {
  reply.view('server/index.njk', { foo: 'Hello from template' })
})
// fastify.get('/', (request, reply) => reply.send({ hello: 'world' }))

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, functional/functional-parameters
const start = async () => {
  // eslint-disable-next-line functional/no-try-statement
  try {
    await fastify.listen(port)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start().catch(err => {
  console.error(err)
})
