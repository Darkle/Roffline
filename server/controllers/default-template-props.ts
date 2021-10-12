import { FastifyRequest, FastifyReply } from 'fastify'

import { version as appVersion } from '../../package.json'
import { isDev } from '../utils'

// eslint-disable-next-line functional/prefer-type-literal
interface FastifyReplyWithLocals extends FastifyReply {
  locals: ReplyLocals
}

type ReplyLocals = {
  basePath: string
  isSubPage: boolean
  currentSubredditBrowsing: string
  cacheBustString: string
  csrfToken: string
}

async function setDefaultTemplateProps(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const path = request.urlData().path as string
  const basePath = path.split('/')[1]
  const csrfToken = await reply.generateCsrf()

  const replyWithLocals = reply as FastifyReplyWithLocals

  replyWithLocals.locals.basePath = path === '/' ? 'index' : (basePath as string)
  replyWithLocals.locals.isSubPage = request.url.startsWith('/sub/')
  replyWithLocals.locals.currentSubredditBrowsing = request.url.split('/')[2]?.split('?')[0] as string
  replyWithLocals.locals.cacheBustString = `?cachebust=${isDev ? `${Date.now()}` : appVersion}`
  replyWithLocals.locals.csrfToken = csrfToken

  // eslint-disable-next-line functional/immutable-data,no-param-reassign,semi-style
  ;(request.body as { _csrf: string })._csrf = csrfToken
}

export { setDefaultTemplateProps }
