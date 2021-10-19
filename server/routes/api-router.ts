import { FastifyInstance } from 'fastify'
import { infiniteScrollGetMorePosts } from '../controllers/posts/posts'
import { checkUserLoggedIn } from '../controllers/user'

// TODO: make sure to do a check they are logged in if not already as this is a new prefix route
//TODO: also dont forget to add onRequest: fastify.csrfProtection to each POST route
//TODO: remember to make sure the csrf and logged in prehandlers come before other prehandlers

const mainPreHandlers = [checkUserLoggedIn]

const apiRoutes = (fastify: FastifyInstance, _: unknown, done: (err?: Error) => void): void => {
  fastify.get('/infinite-scroll-load-more-posts', { preHandler: mainPreHandlers }, async (request, reply) => {
    const posts = await infiniteScrollGetMorePosts(request)
    reply.send(posts)
  })

  done()
}

export { apiRoutes }
