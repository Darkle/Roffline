type WindowWithCSRFToken = {
  csrfToken: string
} & Window

declare const window: WindowWithCSRFToken

const $$ = (q: string): HTMLElement[] => Array.from(document.querySelectorAll(q))
const $ = document.querySelector.bind(document)

const checkFetchResponseStatus = (response: Response): Response | Promise<never> =>
  response?.ok
    ? response
    : Promise.reject(new Error(response.statusText?.length ? response.statusText : response.status.toString()))

const parseJSON = (res: Response): Promise<Record<string, unknown>> =>
  res.json() as Promise<Record<string, unknown>>

const fetchPostPutHeaders = {
  'Content-Type': 'application/json',
  'csrf-token': window.csrfToken,
}

const Fetcher = {
  getText(path: string): Promise<string> {
    return fetch(path)
      .then(checkFetchResponseStatus)
      .then(resp => resp.text())
  },
  getJSON(path: string): Promise<Record<string, unknown>> {
    return fetch(path).then(checkFetchResponseStatus).then(parseJSON)
  },
  async postJSON(path: string, data: Record<string, unknown>): Promise<void> {
    await fetch(path, { method: 'POST', headers: fetchPostPutHeaders, body: JSON.stringify(data) }).then(
      checkFetchResponseStatus
    )
  },
  async putJSON(path: string, data: Record<string, unknown>): Promise<void> {
    await fetch(path, { method: 'PUT', headers: fetchPostPutHeaders, body: JSON.stringify(data) }).then(
      checkFetchResponseStatus
    )
  },
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export { Fetcher, wait, $, $$ }
