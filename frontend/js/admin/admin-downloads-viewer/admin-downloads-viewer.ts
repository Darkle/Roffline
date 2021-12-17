import * as Vue from 'vue'
import { Tabulator } from 'tabulator-tables'
import { encaseRes, nullable as MaybeNullable } from 'pratica'
import { match } from 'ts-pattern'
import type { Maybe } from 'pratica'

import { ignoreScriptTagCompilationWarnings } from '../../frontend-utils'
import { tableColumns } from './table-columns'
import type { PostWithMediaDownloadInfo } from '../../../../downloads/media/media-downloads-viewer-organiser'
import type { DownloadUpdateData } from '../../../../server/controllers/admin/server-side-events'

type FrontendDownload = Pick<
  PostWithMediaDownloadInfo,
  | 'id'
  | 'url'
  | 'mediaDownloadTries'
  | 'downloadFailed'
  | 'downloadCancelled'
  | 'downloadCancellationReason'
  | 'downloadSkipped'
  | 'downloadSkippedReason'
  | 'downloadStarted'
  | 'downloadSucceeded'
  | 'downloadProgress'
  | 'downloadSpeed'
  | 'downloadedBytes'
  | 'downloadFileSize'
> & { downloadError: string | undefined }

type SSEEvent = Event & { data: string; event: string }

/* eslint-disable functional/no-let,max-lines-per-function */

let tableData = [] as FrontendDownload[]

let table = null as null | Tabulator

const getDownload = (postId: string): Maybe<FrontendDownload> =>
  MaybeNullable(tableData.find(download => download.id === postId))

function replaceTableData(ev: Event): void {
  const { data } = ev as SSEEvent

  encaseRes(JSON.parse(data)).cata({
    Ok: (parsedData): void => {
      console.dir(parsedData)

      tableData = parsedData as FrontendDownload[]

      table?.setData(tableData).catch(err => console.error(err))
    },
    Err: msg => console.error(msg),
  })
}

function updateDownloadProps(ev: Event): void {
  const { data } = ev as SSEEvent

  encaseRes(JSON.parse(data)).cata({
    Ok: (parsedData): void => {
      const eventAndData = parsedData as { event: string; data: DownloadUpdateData }

      console.dir(eventAndData)

      getDownload(eventAndData.data.postId).cata({
        Just: (download: FrontendDownload): void => {
          match(eventAndData)
            .with({ event: 'download-started' }, () => {
              download.downloadStarted = true
            })
            .with({ event: 'download-failed' }, () => {
              download.downloadFailed = true
              download.downloadError = eventAndData.data.err
            })
            .with({ event: 'download-succeeded' }, () => {
              download.downloadSucceeded = true
            })
            .with({ event: 'download-cancelled' }, () => {
              download.downloadCancelled = true
              download.downloadCancellationReason = eventAndData.data.reason as string
            })
            .with({ event: 'download-skipped' }, () => {
              download.downloadSkipped = true
              download.downloadSkippedReason = eventAndData.data.reason as string
            })
            .with({ event: 'download-progress' }, () => {
              download.downloadFileSize = eventAndData.data.downloadFileSize as number
              download.downloadedBytes = eventAndData.data.downloadedBytes as number
              download.downloadSpeed = eventAndData.data.downloadSpeed as number
              download.downloadProgress = eventAndData.data.downloadProgress as number
            })
            .with({ event: 'download-media-try-increment' }, () => {
              download.mediaDownloadTries = download.mediaDownloadTries + 1
            })
            .run()
        },
        Nothing: () => console.log(`Couldn't find download in tableData. PostId: ${eventAndData.data.postId}`),
      })
    },
    Err: msg => console.error(msg),
  })
}

const evtSource = new EventSource('/admin/api/sse-media-downloads-viewer')

evtSource.addEventListener('page-load', replaceTableData)
evtSource.addEventListener('new-download-batch-started', replaceTableData)

evtSource.addEventListener('downloads-cleared', (): void => {
  tableData = []
  table?.setData(tableData).catch(err => console.error(err))
})

evtSource.addEventListener('download-started', updateDownloadProps)
evtSource.addEventListener('download-failed', updateDownloadProps)
evtSource.addEventListener('download-succeeded', updateDownloadProps)
evtSource.addEventListener('download-cancelled', updateDownloadProps)
evtSource.addEventListener('download-skipped', updateDownloadProps)
evtSource.addEventListener('download-progress', updateDownloadProps)
evtSource.addEventListener('download-media-try-increment', updateDownloadProps)
evtSource.addEventListener('error', err => console.error(err))

window.addEventListener('onbeforeunload', () => evtSource.close())

table = new Tabulator('#downloads-container', {
  columns: tableColumns as Tabulator.ColumnDefinition[],
  height: '80vh',
  dataLoader: true,
  reactiveData: true,
  data: tableData,
  responsiveLayout: true,
})

const AdminDownloadsViewer = Vue.defineComponent({
  methods: {},
  template: /* html */ `
    <div id="downloads-container"></div>
  `,
})

const app = Vue.createApp(AdminDownloadsViewer)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('main')

export { FrontendDownload }
