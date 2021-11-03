import { FastifyInstance } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { mainLogger } from '../../logging/logging'
import { csrfProtection } from '../controllers/csrf'
import { infiniteScrollGetMorePosts } from '../controllers/posts/posts'
import { bulkImportSubreddits, exportUserSubs, addSubreddit, removeSubreddit } from '../controllers/subs'
import { checkUserLoggedIn, updateUserSetting } from '../controllers/user'
import {
  updateUserSettingsSchema,
  bulkImportUserSubsSchema,
  addUserSubSchema,
  removeUserSubSchema,
} from './api-router-schema'

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

  fastify.post('/add-user-subreddit', {
    preHandler: [...mainPreHandlers, csrfProtection],
    handler: addSubreddit,
    schema: addUserSubSchema,
  })

  fastify.post('/remove-user-subreddit', {
    preHandler: [...mainPreHandlers, csrfProtection],
    handler: removeSubreddit,
    schema: removeUserSubSchema,
  })

  fastify.post('/bulk-import-user-subs', {
    preHandler: [...mainPreHandlers, csrfProtection],
    handler: bulkImportSubreddits,
    schema: bulkImportUserSubsSchema,
  })

  fastify.all('*', (req, reply) => {
    mainLogger.error(`404, page not found: ${req.url}`)
    reply.code(HttpStatusCode.NOT_FOUND).send()
  })

  done()
}

export { apiRoutes }
