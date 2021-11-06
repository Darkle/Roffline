import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'
import auth from 'basic-auth'

function basicAuth(req: FastifyRequest, reply: FastifyReply, next: (next?: Error) => void): void {
  const credentials = auth.parse(req.headers['authorization'] || '')

  // eslint-disable-next-line functional/no-conditional-statement
  if (credentials?.name === 'admin' && credentials?.pass === process.env['ADMIN_PASS']) return next()

  reply.header('WWW-Authenticate', 'Basic').code(HttpStatusCode.UNAUTHORIZED).send('Authentication required.')
}

export { basicAuth }
