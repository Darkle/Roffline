import { Tabulator } from 'tabulator-tables'
import { encaseRes } from 'pratica'
// import { match } from 'ts-pattern'

import { tableColumns } from './table-columns'
import type { PostWithMediaDownloadInfo } from '../../../../downloads/media/media-downloads-viewer-organiser'
import type {
  DownloadReadyToBeSent,
  // DownloadUpdateData,
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
> & { status: Status; downloadError: string | null }

type SSEEvent = Event & { data: string; type: string }

// type UpdateRow = Promise<Tabulator.RowComponent>

// eslint-disable-next-line functional/no-let
let tableData = [] as FrontendDownload[]

const minColumnWidth = 200

const table = new Tabulator('#downloads-container', {
  columns: tableColumns,
  height: '60vh',
  layout: 'fitColumns',
  data: tableData,
  responsiveLayout: 'collapse',
  groupBy: 'status',
  groupToggleElement: 'header',
  // @ts-expect-error types are wrong
  columnDefaults: {
    minWidth: minColumnWidth,
  },
})

// table.on('rowMouseEnter', function (e, row) {
//   //e - the event object
//   //row - row component
// })

// table.on('rowMouseMove', function (e, row) {
//   //e - the event object
//   //row - row component
// })

// table.on('rowMouseLeave', function (e, row) {
//   //e - the event object
//   //row - row component
// })

/*****
  We removed empty keys server side to make the payload smaller.
  Now we recreate them.
*****/
const reconstructMinimizedDownloadData = (download: DownloadReadyToBeSent): FrontendDownload => ({
  downloadFailed: false,
  downloadError: null,
  downloadCancelled: false,
  downloadCancellationReason: '',
  downloadSkipped: false,
  downloadSkippedReason: '',
  downloadStarted: false,
  downloadSucceeded: false,
  downloadProgress: 0,
  downloadSpeed: 0,
  downloadedBytes: 0,
  downloadFileSize: 0,
  status: 'queued',
  ...download,
})

function replaceTableData(ev: Event): void {
  const { data } = ev as SSEEvent

  encaseRes(() => JSON.parse(data) as DownloadReadyToBeSent[]).cata({
    Ok: (parsedData): void => {
      tableData = parsedData?.map(reconstructMinimizedDownloadData) as FrontendDownload[]
      console.info(tableData)

      table.setData(tableData).catch(err => console.error(err))
    },
    Err: msg => console.error(msg),
  })
}

// type UpdateDownloadPropsParsedData = { type: string; data: DownloadUpdateData }

// function updateDownloadProps(ev: Event): void {
//   const { data } = ev as SSEEvent

//   encaseRes(() => JSON.parse(data) as UpdateDownloadPropsParsedData).cata({
//     Ok: (parsedData): void => {
//       const eventAndData = parsedData as UpdateDownloadPropsParsedData
//       console.log(eventAndData.type)
//       console.dir(eventAndData)

//       const rowPostId = eventAndData.data.postId
//       const rowDownload = table.getRow(rowPostId).getData() as FrontendDownload

//       const updatedRowProps = match(eventAndData)
//         .with({ type: 'download-started' }, () => ({ downloadStarted: true, status: 'downloading' }))
//         .with({ type: 'download-failed' }, () => ({
//           downloadFailed: true,
//           downloadError: eventAndData.data.err,
//           status: 'failed',
//         }))
//         .with({ type: 'download-succeeded' }, () => ({
//           downloadSucceeded: true,
//           status: 'success',
//         }))
//         .with({ type: 'download-cancelled' }, () => ({
//           downloadCancelled: true,
//           downloadCancellationReason: eventAndData.data.reason as string,
//           status: 'cancelled',
//         }))
//         .with({ type: 'download-skipped' }, () => ({
//           downloadSkipped: true,
//           downloadSkippedReason: eventAndData.data.reason as string,
//           status: 'skipped',
//         }))
//         .with({ type: 'download-progress' }, () => ({
//           downloadFileSize: eventAndData.data.downloadFileSize as number,
//           downloadedBytes: eventAndData.data.downloadedBytes as number,
//           downloadSpeed: eventAndData.data.downloadSpeed as number,
//           downloadProgress: eventAndData.data.downloadProgress as number,
//         }))
//         .with({ type: 'download-media-try-increment' }, () => ({
//           mediaDownloadTries: rowDownload.mediaDownloadTries + 1,
//         }))
//         .run()

//       // @ts-expect-error - The type for this is wrong, it doesn't return a boolean but rather Promise<TabulatorRowComponent>
//       ;(table.updateRow(rowPostId, { ...rowDownload, ...updatedRowProps }) as UpdateRow).catch(
//         (err: Error): void => {
//           console.error(err)
//         }
//       )
//     },
//     Err: msg => console.error(msg),
//   })
// }

const evtSource = new EventSource('/admin/api/sse-media-downloads-viewer')

evtSource.addEventListener('page-load', replaceTableData)
evtSource.addEventListener('new-download-batch-started', replaceTableData)

evtSource.addEventListener('downloads-cleared', (): void => {
  console.log('downloads-cleared')
  tableData = []
  table.setData(tableData).catch(err => console.error(err))
})

// evtSource.addEventListener('download-started', thing => {
//   console.log('=====download-started 1=============')
//   console.log(thing)
//   console.log('=====download-started 2=============')
// })
// evtSource.addEventListener('download-failed', thing => {
//   console.log('=====download-failed 1=============')
//   console.log(thing)
//   console.log('=====download-failed 2=============')
// })
// evtSource.addEventListener('download-succeeded', thing => {
//   console.log('=====download-succeeded 1=============')
//   console.log(thing)
//   console.log('=====download-succeeded 2=============')
// })
// evtSource.addEventListener('download-cancelled', thing => {
//   console.log('=====download-cancelled 1=============')
//   console.log(thing)
//   console.log('=====download-cancelled 2=============')
// })
// evtSource.addEventListener('download-skipped', thing => {
//   console.log('=====download-skipped 1=============')
//   console.log(thing)
//   console.log('=====download-skipped 2=============')
// })
// evtSource.addEventListener('download-progress', thing => {
//   console.log('=====download-progress 1=============')
//   console.log(thing)
//   console.log('=====download-progress 2=============')
// })
// evtSource.addEventListener('download-media-try-increment', thing => {
//   console.log('=====download-media-try-increment 1=============')
//   console.log(thing)
//   console.log('=====download-media-try-increment 2=============')
// })

// evtSource.addEventListener('download-started', updateDownloadProps)
// evtSource.addEventListener('download-failed', updateDownloadProps)
// evtSource.addEventListener('download-succeeded', updateDownloadProps)
// evtSource.addEventListener('download-cancelled', updateDownloadProps)
// evtSource.addEventListener('download-skipped', updateDownloadProps)
// evtSource.addEventListener('download-progress', updateDownloadProps)
// evtSource.addEventListener('download-media-try-increment', updateDownloadProps)
// evtSource.addEventListener('error', err => console.error(err))

window.addEventListener('beforeunload', () => evtSource.close())

export { FrontendDownload }
