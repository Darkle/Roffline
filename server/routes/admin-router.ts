import { FastifyInstance } from 'fastify'

import { adminStats } from '../controllers/admin/admin-stats'
import { basicAuth } from '../controllers/admin/basic-auth'

//TODO: add fastify validation to all the routes

const mainPreHandlers = [basicAuth]

const adminRoutes = (fastify: FastifyInstance, __: unknown, done: (err?: Error) => void): void => {
  fastify.get('/', { preHandler: [...mainPreHandlers, adminStats] }, (_: unknown, reply) => {
    reply.view('admin/stats-page', {
      pageTitle: 'Roffline::Stats',
    })
  })

  // router.get('/logs-viewer', (req, res) => res.render('admin/logs-viewer', { pageTitle: 'Roffline::Logs Viewer' }))

  // router.get('/downloads-viewer', (req, res) =>
  //   res.render('admin/downloads-viewer', { pageTitle: 'Roffline::Downloads Viewer' })
  // )

  // router.get('/database-viewer', (req, res) =>
  //   res.render('admin/database-viewer', { pageTitle: 'Roffline::Database Viewer' })
  // )

  done()
}

export { adminRoutes }
