import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { db } from '../../db/db'
import { updateAdminSetting } from '../controllers/admin/admin-settings'
import { getAdminStats } from '../controllers/admin/admin-stats'
import { basicAuth } from '../controllers/admin/basic-auth'
import { csrfProtection } from '../controllers/csrf'
import { deleteUserSchema, updateAdminSettingsSchema } from './api-router-schema'

//TODO: add fastify validation to all the routes that need it

const mainPreHandlers = [basicAuth]

// eslint-disable-next-line max-lines-per-function
const adminApiRoutes = (fastify: FastifyInstance, __: unknown, done: (err?: Error) => void): void => {
  fastify.get('/get-stats', { preHandler: mainPreHandlers }, getAdminStats)

  fastify.get(
    '/get-users',
    { preHandler: mainPreHandlers },
    async (_: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const users = await db.getAllUsersDBDataForAdmin()
      reply.send(users)
    }
  )

  fastify.put(
    '/update-admin-setting',
    { preHandler: [...mainPreHandlers, csrfProtection], schema: updateAdminSettingsSchema },
    updateAdminSetting
  )

  fastify.delete(
    '/delete-user',
    { preHandler: [...mainPreHandlers, csrfProtection], schema: deleteUserSchema },
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const { userToDelete } = req.body as { userToDelete: string } & FastifyRequest

      await db.deleteUser(userToDelete)

      reply.code(HttpStatusCode.OK).send()
    }
  )

  done()
}

export { adminApiRoutes }
