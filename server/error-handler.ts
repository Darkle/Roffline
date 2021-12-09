import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { mainLogger } from '../logging/logging'

function fastifyErrorHandler(err: FastifyError, _: FastifyRequest, reply: FastifyReply): void {
  mainLogger.error(err)

  reply
    .code(HttpStatusCode.INTERNAL_SERVER_ERROR)
    .send(`${HttpStatusCode.INTERNAL_SERVER_ERROR} Internal Server Error`)
}

export { fastifyErrorHandler }
