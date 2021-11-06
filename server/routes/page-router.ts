import { FastifyInstance } from 'fastify'

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
  fastify.get('/login', { preHandler: redirectLoginPageToHomeIfAlreadyLoggedIn }, (req, reply) => {
    /*****
      The login redirects to itself if the login fails due to username not found. We show
      a notice if this is the case. Since the login api route and the login page route are
      seperate, we need to use a cookie to tell if we should show the error notification
      on the login page. We then need to clear the cookie.
    *****/
    const userNotFound = req.cookies['userNotFound'] as string | null

    reply.clearCookie('userNotFound').view('login-page', {
      pageTitle: 'Roffline - Login',
      uniqueUsername: generateRandomUniqueUsername(),
      csrfToken: createCsrfToken(),
      userNotFound,
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

  done()
}

export { pageRoutes }
