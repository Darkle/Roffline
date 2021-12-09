// eslint-disable-next-line no-restricted-imports
import querystring from 'querystring'

import type { FastifyInstance } from 'fastify'

import { basicAuth } from '../controllers/admin/basic-auth'
import { createCsrfToken } from '../controllers/csrf'
import { getAdminSettingsForAnAdminPage } from '../controllers/admin/admin-settings'

const mainPreHandlers = [basicAuth]

// eslint-disable-next-line max-lines-per-function
const adminRoutes = (fastify: FastifyInstance, __: unknown, done: (err?: Error) => void): void => {
  fastify.get('/', { preHandler: mainPreHandlers }, (_: unknown, reply) => {
    reply.view('admin/admin-stats-page', {
      pageTitle: 'Roffline::Admin::Stats',
    })
  })

  fastify.get(
    '/settings',
    { preHandler: [...mainPreHandlers, getAdminSettingsForAnAdminPage] },
    (_: unknown, reply) => {
      reply.view('admin/admin-settings-page', {
        pageTitle: 'Roffline::Admin::Settings',
        csrfToken: createCsrfToken(),
        unescapeHTML: querystring.unescape,
      })
    }
  )

  fastify.get('/users', { preHandler: mainPreHandlers }, (_: unknown, reply) => {
    reply.view('admin/admin-users-page', {
      pageTitle: 'Roffline::Admin::Users',
      csrfToken: createCsrfToken(),
      unescapeHTML: querystring.unescape,
    })
  })

  fastify.get('/db-viewer', { preHandler: mainPreHandlers }, (_: unknown, reply) => {
    reply.view('admin/admin-db-viewer-page', {
      pageTitle: 'Roffline::Admin::DB-Viewer',
      csrfToken: createCsrfToken(),
      unescapeHTML: querystring.unescape,
    })
  })

  fastify.get('/logs-viewer', { preHandler: mainPreHandlers }, (_: unknown, reply) => {
    reply.view('admin/admin-logs-viewer-page', {
      pageTitle: 'Roffline::Admin::Logs-Viewer',
      csrfToken: createCsrfToken(),
      unescapeHTML: querystring.unescape,
    })
  })

  // router.get('/downloads-viewer', (req, res) =>
  //   res.render('admin/downloads-viewer', { pageTitle: 'Roffline::Downloads Viewer' })
  // )

  done()
}

export { adminRoutes }
