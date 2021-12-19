import * as Vue from 'vue'
import { Tabulator } from 'tabulator-tables'
import { encaseRes } from 'pratica'
import { match } from 'ts-pattern'
// import type { Maybe } from 'pratica'

import { ignoreScriptTagCompilationWarnings } from '../../frontend-utils'
import { tableColumns } from './table-columns'
import type { PostWithMediaDownloadInfo } from '../../../../downloads/media/media-downloads-viewer-organiser'
import type {
  DownloadReadyToBeSent,
  DownloadUpdateData,
} from '../../../../server/controllers/admin/server-side-events'

type Status = 'queued' | 'failed' | 'success' | 'cancelled' | 'skipped' | 'downloading'

type FrontendDownload = Pick<
  PostWithMediaDownloadInfo,
  | 'id'
  | 'url'
  | 'permalink'
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
> & { status: Status; downloadError: string | undefined }

type SSEEvent = Event & { data: string; event: string }

type UpdateRow = Promise<Tabulator.RowComponent>

/* eslint-disable functional/no-let,max-lines-per-function, semi-style */

let tableData = [] as FrontendDownload[]

const table = new Tabulator('#downloads-container', {
  columns: tableColumns,
  height: '80vh',
  layout: 'fitColumns',
  data: tableData,
  responsiveLayout: 'collapse',
  groupBy: 'status',
  groupToggleElement: 'header',
})

// const getDownload = (postId: string): Maybe<FrontendDownload> =>
//   MaybeNullable(tableData.find(download => download.id === postId))

/*****
  We removed empty keys server side to make smaller payload.
  Now we recreate them if they are missing.
*****/
function reconstructMinimizedDownloadsData(downloads: DownloadReadyToBeSent[]): FrontendDownload[] {
  //dont forget to add status and set it to queued
  /*****
        .with(__.string, RA.isNonEmptyString)
    .with(__.number, (v: number) => v > 0)
    .with(__.boolean, (v: boolean) => v !== false)
    .with(__.nullish, () => false)
  *****/
}

function replaceTableData(ev: Event): void {
  const { data } = ev as SSEEvent

  encaseRes(() => JSON.parse(data) as DownloadReadyToBeSent[]).cata({
    Ok: (parsedData): void => {
      tableData = parsedData?.map() as FrontendDownload[]
      console.dir(tableData)

      table.setData(tableData).catch(err => console.error(err))
    },
    Err: msg => console.error(msg),
  })
}

type UpdateDownloadPropsParsedData = { event: string; data: DownloadUpdateData }

function updateDownloadProps(ev: Event): void {
  const { data } = ev as SSEEvent

  encaseRes(() => JSON.parse(data) as UpdateDownloadPropsParsedData).cata({
    Ok: (parsedData): void => {
      const eventAndData = parsedData as UpdateDownloadPropsParsedData

      console.dir(eventAndData)

      const rowPostId = eventAndData.data.postId
      const rowDownload = table.getRow(rowPostId).getData() as FrontendDownload

      const updatedRowProps = match(eventAndData)
        .with({ event: 'download-started' }, () => ({ downloadStarted: true, status: 'downloading' }))
        .with({ event: 'download-failed' }, () => ({
          downloadFailed: true,
          downloadError: eventAndData.data.err,
          status: 'failed',
        }))
        .with({ event: 'download-succeeded' }, () => ({
          downloadSucceeded: true,
          status: 'success',
        }))
        .with({ event: 'download-cancelled' }, () => ({
          downloadCancelled: true,
          downloadCancellationReason: eventAndData.data.reason as string,
          status: 'cancelled',
        }))
        .with({ event: 'download-skipped' }, () => ({
          downloadSkipped: true,
          downloadSkippedReason: eventAndData.data.reason as string,
          status: 'skipped',
        }))
        .with({ event: 'download-progress' }, () => ({
          downloadFileSize: eventAndData.data.downloadFileSize as number,
          downloadedBytes: eventAndData.data.downloadedBytes as number,
          downloadSpeed: eventAndData.data.downloadSpeed as number,
          downloadProgress: eventAndData.data.downloadProgress as number,
        }))
        .with({ event: 'download-media-try-increment' }, () => ({
          mediaDownloadTries: rowDownload.mediaDownloadTries + 1,
        }))
        .run()

      // @ts-expect-error - The type for this is wrong, it doesn't return a boolean but rather Promise<TabulatorRowComponent>
      ;(table.updateRow(rowPostId, { ...rowDownload, ...updatedRowProps }) as UpdateRow).catch(
        (err: Error): void => {
          console.error(err)
        }
      )
    },
    Err: msg => console.error(msg),
  })
}

const evtSource = new EventSource('/admin/api/sse-media-downloads-viewer')

evtSource.addEventListener('page-load', replaceTableData)
evtSource.addEventListener('new-download-batch-started', replaceTableData)

evtSource.addEventListener('downloads-cleared', (): void => {
  tableData = []
  table.setData(tableData).catch(err => console.error(err))
})

evtSource.addEventListener('download-started', updateDownloadProps)
evtSource.addEventListener('download-failed', updateDownloadProps)
evtSource.addEventListener('download-succeeded', updateDownloadProps)
evtSource.addEventListener('download-cancelled', updateDownloadProps)
evtSource.addEventListener('download-skipped', updateDownloadProps)
evtSource.addEventListener('download-progress', updateDownloadProps)
evtSource.addEventListener('download-media-try-increment', updateDownloadProps)
evtSource.addEventListener('error', err => console.error(err))

window.addEventListener('beforeunload', () => evtSource.close())

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
