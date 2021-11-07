import { FastifyInstance } from 'fastify'

import { updateAdminSetting } from '../controllers/admin/admin-settings'
import { getAdminStats } from '../controllers/admin/admin-stats'
import { basicAuth } from '../controllers/admin/basic-auth'
import { csrfProtection } from '../controllers/csrf'
import { updateAdminSettingsSchema } from './api-router-schema'

//TODO: add fastify validation to all the routes
//TODO: Dont forget to do the basic auth for api too

const mainPreHandlers = [basicAuth]

const adminApiRoutes = (fastify: FastifyInstance, _: unknown, done: (err?: Error) => void): void => {
  fastify.get('/get-stats-json', { preHandler: mainPreHandlers }, getAdminStats)

  fastify.put(
    '/update-admin-setting',
    { preHandler: [...mainPreHandlers, csrfProtection], schema: updateAdminSettingsSchema },
    updateAdminSetting
  )

  done()
}

export { adminApiRoutes }
