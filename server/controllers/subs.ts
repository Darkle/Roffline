import type { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'
import R from 'ramda'

import { db } from '../../db/db'

const subsArrToString = R.join(' ')

// eslint-disable-next-line functional/immutable-data
const sortSubs = (arr: string[]): string[] => arr.sort()

function addSubreddit(req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const user = req.cookies['loggedInUser'] as string
  const { subToAdd } = req.body as { subToAdd: string }

  return db.addSubreddit(user, subToAdd).then(_ => reply.code(HttpStatusCode.OK).send())
}

function removeSubreddit(req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const user = req.cookies['loggedInUser'] as string
  const { subToRemove } = req.body as { subToRemove: string }

  return db.removeUserSubreddit(user, subToRemove).then(_ => reply.code(HttpStatusCode.OK).send())
}

function exportUserSubs(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = request.cookies['loggedInUser'] as string

  return db
    .getUserSubreddits(user)
    .then(sortSubs)
    .then(subsArrToString)
    .then(subsAsString => {
      reply.header('Content-disposition', 'attachment; filename=subs.txt')
      reply.type('txt')
      reply.send(subsAsString)
    })
}

async function bulkImportSubreddits(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = request.cookies['loggedInUser'] as string
  const { subsToImport } = request.body as { subsToImport: string[] }

  await db.batchAddSubreddits(user, subsToImport).then(_ => reply.code(HttpStatusCode.OK).send())
}

export { exportUserSubs, bulkImportSubreddits, addSubreddit, removeSubreddit }
