import Tokens from 'csrf'
import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

const csrfTokens = new Tokens()

const csrfSecret = csrfTokens.secretSync()

type RequestWithCsrfBody = {
  csrfToken: string
}

function csrfProtection(
  request: FastifyRequest,
  response: FastifyReply,
  next: (next?: Error) => void
): FastifyReply | void {
  const { csrfToken } = request.body as RequestWithCsrfBody

  return csrfTokens.verify(csrfSecret, csrfToken)
    ? next()
    : response.code(HttpStatusCode.FORBIDDEN).send('Invalid CSRF token')
}

function createCsrfToken(): string {
  return csrfTokens.create(csrfSecret)
}

export { csrfTokens, csrfSecret, csrfProtection, createCsrfToken }
