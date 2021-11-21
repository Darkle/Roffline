import fetch from 'node-fetch-commonjs'

import { mainLogger } from '../logging/logging'

const offlineCheckerUrl = process.env['OFFLINE_CHECK_URL'] as string

const isOffline = (): Promise<boolean> =>
  fetch(offlineCheckerUrl, { method: 'HEAD' })
    .then(resp => !resp.ok)
    .catch(err => {
      mainLogger.trace(err)
      return true
    })

export { isOffline }
