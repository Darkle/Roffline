import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { mainLogger } from '../logging/logging'

function notFoundHandler(req: FastifyRequest, reply: FastifyReply): void {
  mainLogger.error(`404, page not found: ${req.url}`)

  // eslint-disable-next-line functional/no-conditional-statement
  if (req.url.startsWith('/admin/api/') || req.url.startsWith('/api/')) {
    reply.code(HttpStatusCode.NOT_FOUND).send()
    return
  }

  // eslint-disable-next-line functional/no-conditional-statement
  if (req.url.startsWith('/admin/')) {
    reply.code(HttpStatusCode.NOT_FOUND).send(`404 - page not found`)
    return
  }

  reply.code(HttpStatusCode.NOT_FOUND).view('404-page', { pageTitle: 'Page Not Found' })
}

export { notFoundHandler }
