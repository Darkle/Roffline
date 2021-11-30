import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { db } from '../../db/db'
// import { adminMediaDownloadsViewerOrganiserEmitter } from '../../downloads/media/media-downloads-viewer-organiser'
import { downloadLogs, getLogs } from '../controllers/admin/admin-get-logs'
import { updateAdminSetting } from '../controllers/admin/admin-settings'
import { getAdminStats } from '../controllers/admin/admin-stats'
import { basicAuth } from '../controllers/admin/basic-auth'
import { csrfProtection } from '../controllers/csrf'
import {
  adminGetPaginatedTableDataSchema,
  deleteUserSchema,
  updateAdminSettingsSchema,
} from './api-router-schema'

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

  fastify.get(
    '/list-db-tables',
    { preHandler: mainPreHandlers },
    async (_: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const dbTables = await db.adminListTablesInDB()
      reply.send(dbTables)
    }
  )

  fastify.get(
    '/get-paginated-table-data',
    { preHandler: mainPreHandlers, schema: adminGetPaginatedTableDataSchema },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      type Query = {
        tableName: string
        page: number
        searchTerm?: string
      }
      const { tableName, page, searchTerm } = request.query as Query

      // eslint-disable-next-line functional/no-conditional-statement
      if (tableName === 'comments') {
        const paginatedCommentsTableData = searchTerm
          ? await db.adminSearchCommentsDBDataPaginated(searchTerm)
          : await db.adminGetCommentsDBDataPaginated(page)

        reply.send(paginatedCommentsTableData)
        return
      }

      const paginatedTableData = searchTerm
        ? await db.adminSearchDBTable(tableName, searchTerm, page)
        : await db.adminGetPaginatedTableData(tableName, page)

      reply.send(paginatedTableData)
    }
  )

  fastify.get(
    '/vacuum-db',
    { preHandler: mainPreHandlers },
    async (_: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await db.adminVacuumDB()
      reply.code(HttpStatusCode.OK).send()
    }
  )

  fastify.get('/get-logs', { preHandler: mainPreHandlers }, getLogs)

  fastify.get('/download-logs', { preHandler: mainPreHandlers }, downloadLogs)

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

  // fastify.get(
  //   '/sse-media-downloads-viewer',
  //   { preHandler: mainPreHandlers },
  //   // eslint-disable-next-line max-lines-per-function
  //   (request: FastifyRequest, reply: FastifyReply): void => {
  //     // Send the first data
  //     reply.sse('sample data', options)

  //     const foo = reply => {
  //       reply.sse({ event: 'test', data: index })
  //     }

  //     adminMediaDownloadsViewerOrganiserEmitter.on('event', foo)
  //     adminMediaDownloadsViewerOrganiserEmitter.on('new-download-batch-started', this.posts)
  //     adminMediaDownloadsViewerOrganiserEmitter.on('download-started', postId)
  //     adminMediaDownloadsViewerOrganiserEmitter.on('download-failed', postId, err)
  //     adminMediaDownloadsViewerOrganiserEmitter.on('download-succeeded', postId)
  //     adminMediaDownloadsViewerOrganiserEmitter.on('download-cancelled', postId, reason)
  //     adminMediaDownloadsViewerOrganiserEmitter.on(
  //       'download-progress',
  //       postId,
  //       downloadProgress,
  //       downloadFileSize
  //     )
  //     adminMediaDownloadsViewerOrganiserEmitter.on('download-media-try-increment', postId)

  //     // https://github.com/fastify/fastify/issues/1352#issuecomment-490997485
  //     request.req.on('close', () => {
  //       adminMediaDownloadsViewerOrganiserEmitter.removeListener('event', foo)
  //     })
  //   }
  // )

  done()
}

export { adminApiRoutes }
