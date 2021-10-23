import { FastifyReply, FastifyRequest } from 'fastify'
import R from 'ramda'

import { db } from '../../db/db'

const subsArrToString = R.join(' ')

// eslint-disable-next-line functional/immutable-data
const sortSubs = (arr: string[]): string[] => arr.sort()

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

export { exportUserSubs }
