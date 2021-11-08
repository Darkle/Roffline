// eslint-disable-next-line no-restricted-imports
import querystring from 'querystring'

import { FastifyInstance } from 'fastify'

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

  fastify.get(
    '/users',
    { preHandler: [...mainPreHandlers, getAdminSettingsForAnAdminPage] },
    (_: unknown, reply) => {
      reply.view('admin/admin-users-page', {
        pageTitle: 'Roffline::Admin::Users',
        csrfToken: createCsrfToken(),
        unescapeHTML: querystring.unescape,
      })
    }
  )

  // router.get('/users', (req, res) => res.render('admin/users-page', { pageTitle: 'Roffline::Logs Viewer' }))
  // router.get('/logs-viewer', (req, res) => res.render('admin/logs-viewer', { pageTitle: 'Roffline::Logs Viewer' }))
  // router.get('/database-viewer', (req, res) =>
  //   res.render('admin/database-viewer', { pageTitle: 'Roffline::Database Viewer' })
  // )

  // router.get('/downloads-viewer', (req, res) =>
  //   res.render('admin/downloads-viewer', { pageTitle: 'Roffline::Downloads Viewer' })
  // )

  done()
}

export { adminRoutes }
