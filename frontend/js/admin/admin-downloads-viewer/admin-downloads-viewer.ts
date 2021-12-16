import * as Vue from 'vue'
// import * as RA from 'ramda-adjunct'
import { Tabulator } from 'tabulator-tables'
// import { encaseRes } from 'pratica'

import { ignoreScriptTagCompilationWarnings } from '../../frontend-utils'
import { state } from './admin-downloads-viewer-store'
import { tableColumns } from './table-columns'
import type { PostWithMediaDownloadInfo } from '../../../../downloads/media/media-downloads-viewer-organiser'

type FrontendDownload = Pick<
  PostWithMediaDownloadInfo,
  | 'id'
  | 'url'
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

//TODO: add the other data types it could be
type SSEEvent = Event & { data: FrontendDownload[]; event: string }

// dont put the table in state as that would make vue reactive have to track all the changes in its object
// eslint-disable-next-line  functional/no-let
let table = null as null | Tabulator

function setUpSSEListeners(): void {
  const evtSource = new EventSource('/admin/api/sse-media-downloads-viewer')
  console.log('here')
  evtSource.addEventListener('page-load', (ev): void => {
    console.log('page-load-for-sse called')
    const { data } = ev as SSEEvent
    console.log(data)
    // encaseRes(() => table?.setData(data)).cata({
    //   Ok: RA.noop,
    //   Err: console.error,
    // })
  })

  evtSource.addEventListener('new-download-batch-started', (ev): void => {
    const { data } = ev as SSEEvent
    console.log(data)
    // encaseRes(() => table?.setData(data)).cata({
    //   Ok: RA.noop,
    //   Err: console.error,
    // })
  })

  evtSource.addEventListener('error', err => console.error(err))

  window.addEventListener('onbeforeunload', () => evtSource.close())
}

const AdminDownloadsViewer = Vue.defineComponent({
  data() {
    return {
      state,
    }
  },
  mounted() {
    // console.info(downloads)

    // state.downloads = downloads as Download[]

    table = new Tabulator('#downloads-container', {
      columns: tableColumns as Tabulator.ColumnDefinition[],
    })

    console.log(table)

    setUpSSEListeners()
  },
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
