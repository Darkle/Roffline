import Tokens from 'csrf'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

const csrfTokens = new Tokens()

const csrfSecret = csrfTokens.secretSync()

function csrfProtection(
  request: FastifyRequest,
  response: FastifyReply,
  next: (next?: Error) => void
): FastifyReply | void {
  const { csrfToken: bodyCsrfToken } = request.body as { csrfToken: string | undefined }
  const headerCsrfToken = request.headers['csrf-token'] as string | undefined

  const csrfToken = bodyCsrfToken || headerCsrfToken || ''

  return csrfTokens.verify(csrfSecret, csrfToken)
    ? next()
    : response.code(HttpStatusCode.FORBIDDEN).send('Invalid CSRF token')
}

function createCsrfToken(): string {
  return csrfTokens.create(csrfSecret)
}

export { csrfTokens, csrfSecret, csrfProtection, createCsrfToken }
