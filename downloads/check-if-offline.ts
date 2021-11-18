const offlineCheckerUrl = process.env['OFFLINE_CHECK_URL'] as string

function isOffline(): Promise<boolean> {
  return fetch(offlineCheckerUrl, { method: 'HEAD' }).then(resp => !resp.ok)
}

export { isOffline }
