import type { FastifyRequest, FastifyReply } from 'fastify'
// eslint-disable-next-line no-restricted-imports
import querystring from 'querystring'

import { version as appVersion } from '../../package.json'
import { isDev } from '../utils'
import { createCsrfToken } from './csrf'

type DefaultLocals = {
  basePath: string
  isSubPage: boolean
  currentSubredditBrowsing: string
  cacheBustString: string
  csrfToken: string
  unescapeHTML: (str: string) => string
  isDev: boolean
}

// eslint-disable-next-line max-lines-per-function,complexity
function setDefaultTemplateProps(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
): void {
  const path = request.urlData().path as string
  const basePath = path.split('/')[1]
  const csrfToken = createCsrfToken()
  const replyWithLocals = reply as { locals: DefaultLocals } & FastifyReply

  // eslint-disable-next-line functional/no-conditional-statement
  if (!replyWithLocals.locals) {
    // eslint-disable-next-line functional/immutable-data
    replyWithLocals.locals = {
      basePath: path === '/' ? 'index' : (basePath as string),
      isSubPage: request.url.startsWith('/sub/'),
      currentSubredditBrowsing: request.url.split('/')[2]?.split('?')[0] as string,
      cacheBustString: `?cachebust=${isDev ? Date.now().toString() : appVersion}`,
      csrfToken,
      unescapeHTML: querystring.unescape,
      isDev,
    }
  } else {
    replyWithLocals.locals.basePath = path === '/' ? 'index' : (basePath as string)
    replyWithLocals.locals.isSubPage = request.url.startsWith('/sub/')
    replyWithLocals.locals.currentSubredditBrowsing = request.url.split('/')[2]?.split('?')[0] as string
    replyWithLocals.locals.cacheBustString = `?cachebust=${isDev ? Date.now().toString() : appVersion}`
    replyWithLocals.locals.csrfToken = csrfToken
    replyWithLocals.locals.isDev = isDev
  }

  done()
}

export { setDefaultTemplateProps }
