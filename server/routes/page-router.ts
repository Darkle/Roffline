import { FastifyInstance } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { mainLogger } from '../../logging/logging'
import { urlInfoForTemplate } from '../controllers/url-info'

// fastify.get('/', async (_, __) => ({ hello: 'world' }))
// fastify.get('/', (_, reply) => {
//   reply.view('server/views/index.eta', { foo: 'Hello from template' })
// })
// fastify.get('/', (request, reply) => reply.send({ hello: 'world' }))

// type Options extends FastifyPluginOptions = Record<never, never>, Server extends RawServerBase = RawServerDefault

type SubParams = { subreddit: string }

// eslint-disable-next-line max-lines-per-function
const pageRoutes = (fastify: FastifyInstance, __: unknown, done: (err?: Error) => void): void => {
  fastify.get('/', { preHandler: [urlInfoForTemplate] }, (_, reply) => {
    reply.view('/server/views/index.eta', {
      pageTitle: 'Roffline Home Page',
    })
  })

  /*****
  This redirect is to redirect any links in comments or posts that are just href="/r/foo" links.
*****/
  fastify.get('/r/*', (req, reply) => {
    const urlData = req.urlData()
    reply.redirect(`https://www.reddit.com${urlData.path as string}`)
  })

  fastify.get('/post/:postId/', { preHandler: [] }, (_, reply) => {
    reply.view('/server/views/post.eta')
  })

  fastify.get('/sub/:subreddit/', { preHandler: [urlInfoForTemplate] }, (req, reply) => {
    reply.view('/server/views/index.eta', { pageTitle: `${(req.params as SubParams).subreddit} - Roffline` })
  })

  fastify.get('/settings', (_, reply) => {
    reply.view('/server/views/settings-page.eta', { pageTitle: 'Roffline Settings' })
  })

  fastify.get('/sub-management', (_, reply) => {
    reply.view('sub-management-page', { pageTitle: 'Roffline - Subreddit Management' })
  })

  fastify.get('/search', { preHandler: [] }, (_, reply) => {
    reply.view('search-page', { pageTitle: 'Search Roffline' })
  })

  fastify.get('/help', (_, reply) => {
    reply.view('help-page', { pageTitle: 'Roffline Help' })
  })

  fastify.get('*', (req, reply) => {
    mainLogger.error(`404, page not found: ${req.url}`)
    reply.code(HttpStatusCode.NOT_FOUND).send(`${HttpStatusCode.NOT_FOUND} Page not found`)
  })

  done()
}

export { pageRoutes }
