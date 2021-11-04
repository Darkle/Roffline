import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { mainLogger } from '../../logging/logging'
import {
  checkUserLoggedIn,
  generateRandomUniqueUsername,
  getUserSettings,
  logUserOut,
  redirectLoginPageToHomeIfAlreadyLoggedIn,
} from '../controllers/user'
import { setDefaultTemplateProps } from '../controllers/default-template-props'
import { getPostsPaginated, getPostsPaginatedForSubreddit } from '../controllers/posts/posts'
import { searchPosts } from '../controllers/search'
import { generatePost } from '../controllers/posts/single-post'
import { version as appVersion } from '../../package.json'
import { createCsrfToken } from '../controllers/csrf'

type SubParams = { subreddit: string }

const mainPreHandlers = [checkUserLoggedIn, setDefaultTemplateProps, getUserSettings]

// eslint-disable-next-line max-lines-per-function
const pageRoutes = (fastify: FastifyInstance, __: unknown, done: (err?: Error) => void): void => {
  fastify.get('/login', { preHandler: redirectLoginPageToHomeIfAlreadyLoggedIn }, (_, reply) => {
    reply.view('login-page', {
      pageTitle: 'Roffline - Login',
      uniqueUsername: generateRandomUniqueUsername(),
      csrfToken: createCsrfToken(),
    })
  })

  fastify.get('/logout', logUserOut)

  fastify.get('/', { preHandler: [...mainPreHandlers, getPostsPaginated] }, (_, reply) => {
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

  fastify.get('/post/:postId/', { preHandler: [...mainPreHandlers, generatePost] }, (_, reply) => {
    reply.view('post-page')
  })

  fastify.get(
    '/sub/:subreddit/',
    { preHandler: [...mainPreHandlers, getPostsPaginatedForSubreddit] },
    (req, reply) => {
      reply.view('index', { pageTitle: `${(req.params as SubParams).subreddit} - Roffline` })
    }
  )

  fastify.get('/settings', { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view('settings-page', { pageTitle: 'Roffline Settings' })
  })

  fastify.get('/sub-management', { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view('sub-management-page', { pageTitle: 'Roffline - Subreddit Management' })
  })

  fastify.get('/search', { preHandler: [...mainPreHandlers, searchPosts] }, (_, reply) => {
    reply.view('search-page', { pageTitle: 'Search Roffline' })
  })

  fastify.get('/help', { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view('help-page', { pageTitle: 'Roffline Help', appVersion })
  })

  fastify.setNotFoundHandler((req: FastifyRequest, reply: FastifyReply) => {
    mainLogger.error(`404, page not found: ${req.url}`)
    reply.code(HttpStatusCode.NOT_FOUND).view('404-page', { pageTitle: 'Page Not Found' })
  })

  done()
}

export { pageRoutes }
