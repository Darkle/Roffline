import { FastifyRequest, FastifyReply } from 'fastify'
// eslint-disable-next-line no-restricted-imports
import querystring from 'querystring'

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
  decodeHTML: (str: string) => string
}

// eslint-disable-next-line max-lines-per-function,complexity
async function setDefaultTemplateProps(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const path = request.urlData().path as string
  const basePath = path.split('/')[1]
  const csrfToken = await reply.generateCsrf()

  const replyWithLocals = reply as FastifyReplyWithLocals

  // eslint-disable-next-line functional/no-conditional-statement
  if (!replyWithLocals.locals) {
    // eslint-disable-next-line functional/immutable-data
    replyWithLocals.locals = {
      basePath: path === '/' ? 'index' : (basePath as string),
      isSubPage: request.url.startsWith('/sub/'),
      currentSubredditBrowsing: request.url.split('/')[2]?.split('?')[0] as string,
      cacheBustString: `?cachebust=${isDev ? `${Date.now()}` : appVersion}`,
      csrfToken,
      decodeHTML: querystring.unescape,
    }
  } else {
    replyWithLocals.locals.basePath = path === '/' ? 'index' : (basePath as string)
    replyWithLocals.locals.isSubPage = request.url.startsWith('/sub/')
    replyWithLocals.locals.currentSubredditBrowsing = request.url.split('/')[2]?.split('?')[0] as string
    replyWithLocals.locals.cacheBustString = `?cachebust=${isDev ? `${Date.now()}` : appVersion}`
    replyWithLocals.locals.csrfToken = csrfToken
  }
}

export { setDefaultTemplateProps }
