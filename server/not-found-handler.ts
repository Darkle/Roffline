import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { mainLogger } from '../logging/logging'

const isAnApiRoute = (url: string): boolean => url.startsWith('/admin/api/') || url.startsWith('/api/')

const isAnAdminPage = (url: string): boolean => url.startsWith('/admin/')

function notFoundHandler(req: FastifyRequest, reply: FastifyReply): void {
  mainLogger.error(`404, page not found: ${req.url}`)

  // eslint-disable-next-line functional/no-conditional-statement
  if (isAnApiRoute(req.url)) {
    reply.code(HttpStatusCode.NOT_FOUND).send()
    return
  }

  // eslint-disable-next-line functional/no-conditional-statement
  if (isAnAdminPage(req.url)) {
    reply.code(HttpStatusCode.NOT_FOUND).send(`404 - page not found`)
    return
  }

  reply.code(HttpStatusCode.NOT_FOUND).view('404-page', { pageTitle: 'Page Not Found' })
}

export { notFoundHandler }
