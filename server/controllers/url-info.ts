import { FastifyRequest, FastifyReply } from 'fastify'

// eslint-disable-next-line functional/prefer-type-literal
interface FastifyReplyWithLocals extends FastifyReply {
  locals: ReplyLocals
}

type ReplyLocals = {
  basePath: string
  isSubPage: boolean
  currentSubredditBrowsing: string
}

function urlInfoForTemplate(request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void): void {
  const path = request.urlData().path as string
  const basePath = path.split('/')[1]

  // eslint-disable-next-line functional/immutable-data,semi-style
  ;(reply as FastifyReplyWithLocals).locals = {
    basePath: path === '/' ? 'index' : (basePath as string),
    isSubPage: request.url.startsWith('/sub/'),
    currentSubredditBrowsing: request.url.split('/')[2]?.split('?')[0] as string,
  }

  done()
}

export { urlInfoForTemplate }
