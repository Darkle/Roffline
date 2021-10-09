import { FastifyInstance } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'
import { generate as generatePassPhrase } from 'generate-passphrase'

import { mainLogger } from '../../logging/logging'
import { getUserSettings, logUserOut, checkUserLoggedIn } from '../controllers/user'
import { urlInfoForTemplate } from '../controllers/url-info'

type SubParams = { subreddit: string }

// eslint-disable-next-line max-lines-per-function
const pageRoutes = (fastify: FastifyInstance, __: unknown, done: (err?: Error) => void): void => {
  fastify.addHook('preHandler', checkUserLoggedIn)

  fastify.get('/login', (_, reply) => {
    reply.view('login-page', { pageTitle: 'Roffline - Login', uniqueUsername: generatePassPhrase() })
  })

  fastify.get('/logout', logUserOut)

  fastify.get('/', { preHandler: [urlInfoForTemplate, getUserSettings] }, (_, reply) => {
    reply.view('index', {
      pageTitle: 'Roffline Home Page',
    })
  })

  /*****
  This redirect is to redirect any links in comments or posts that are just reddit short href="/r/foo" links.
  *****/
  fastify.get('/r/*', (req, reply) => {
    const urlData = req.urlData()
    reply.redirect(`https://www.reddit.com${urlData.path as string}`)
  })

  fastify.get('/post/:postId/', { preHandler: [urlInfoForTemplate, getUserSettings] }, (_, reply) => {
    reply.view('post')
  })

  fastify.get('/sub/:subreddit/', { preHandler: [urlInfoForTemplate, getUserSettings] }, (req, reply) => {
    reply.view('index', { pageTitle: `${(req.params as SubParams).subreddit} - Roffline` })
  })

  fastify.get('/settings', { preHandler: [urlInfoForTemplate, getUserSettings] }, (_, reply) => {
    reply.view('settings-page', { pageTitle: 'Roffline Settings' })
  })

  fastify.get('/sub-management', { preHandler: [urlInfoForTemplate, getUserSettings] }, (_, reply) => {
    reply.view('sub-management-page', { pageTitle: 'Roffline - Subreddit Management' })
  })

  fastify.get('/search', { preHandler: [urlInfoForTemplate, getUserSettings] }, (_, reply) => {
    reply.view('search-page', { pageTitle: 'Search Roffline' })
  })

  fastify.get('/help', { preHandler: [urlInfoForTemplate, getUserSettings] }, (_, reply) => {
    reply.view('help-page', { pageTitle: 'Roffline Help' })
  })

  fastify.get('*', (req, reply) => {
    mainLogger.error(`404, page not found: ${req.url}`)
    reply.code(HttpStatusCode.NOT_FOUND).send(`${HttpStatusCode.NOT_FOUND} Page not found`)
  })

  done()
}

export { pageRoutes }
