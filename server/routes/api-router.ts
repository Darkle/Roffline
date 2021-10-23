import { FastifyInstance } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { mainLogger } from '../../logging/logging'
import { csrfProtection } from '../controllers/csrf'
import { infiniteScrollGetMorePosts } from '../controllers/posts/posts'
import { exportUserSubs } from '../controllers/subs'
import { checkUserLoggedIn, updateUserSetting } from '../controllers/user'
import { updateUserSettingsSchema } from './api-router-schema'

//TODO: make sure to do a check they are logged in if not already as this is a new prefix route
//TODO: also dont forget to add onRequest: fastify.csrfProtection to each POST/PUT route
//TODO: remember to make sure the csrf and logged in prehandlers come before other prehandlers
//TODO: add fastify validation to all the routes

const mainPreHandlers = [checkUserLoggedIn]

// eslint-disable-next-line max-lines-per-function
const apiRoutes = (fastify: FastifyInstance, _: unknown, done: (err?: Error) => void): void => {
  fastify.get('/infinite-scroll-load-more-posts', { preHandler: mainPreHandlers }, async (request, reply) => {
    const posts = await infiniteScrollGetMorePosts(request)
    reply.send(posts)
  })

  fastify.get('/export-user-subs', { preHandler: mainPreHandlers }, exportUserSubs)

  fastify.put('/update-user-setting', {
    preHandler: [...mainPreHandlers, csrfProtection],
    handler: updateUserSetting,
    schema: updateUserSettingsSchema,
  })

  // fastify.post('/add-user-subreddit', validate(addSubredditRouteSchema), addSubreddit)

  // fastify.post('/remove-user-subreddit', validate(removeSubredditRouteSchema), removeSubreddit)

  // fastify.post('/bulk-import-user-subs', validate(bulkImportSubsRouteSchema), bulkImportSubreddits)

  fastify.all('*', (req, reply) => {
    mainLogger.error(`404, page not found: ${req.url}`)
    reply.code(HttpStatusCode.NOT_FOUND).send()
  })

  done()
}

export { apiRoutes }
