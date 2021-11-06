import { FastifyInstance } from 'fastify'

import { getAdminStats } from '../controllers/admin/admin-stats'
import { basicAuth } from '../controllers/admin/basic-auth'

//TODO: add fastify validation to all the routes
//TODO: Dont forget to do the basic auth for api too

const mainPreHandlers = [basicAuth]

const adminApiRoutes = (fastify: FastifyInstance, _: unknown, done: (err?: Error) => void): void => {
  fastify.get('/get-stats-json', { preHandler: mainPreHandlers }, getAdminStats)

  done()
}

export { adminApiRoutes }
