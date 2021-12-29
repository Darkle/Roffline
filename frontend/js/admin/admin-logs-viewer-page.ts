import * as R from 'ramda'
import * as Vue from 'vue'
import VueGoodTablePlugin from 'vue-good-table-next'
import JsonViewer from 'vue3-json-viewer'
import type { JSONViewer, VGTable } from '../frontend-global-types'

import { checkFetchResponseStatus, $ } from '../frontend-utils'

type Log = { level: number; time: string; name: string; msg?: string } & Record<string, unknown>

type Logs = Log[]

type FormattedLog = Log & { level: string; data: string }

type FormattedLogs = FormattedLog[]

type WindowWithLogs = { logs: Logs } & Window

type LogLevelNames = {
  [key: number]: string
}

declare const window: WindowWithLogs

const rowsPerPage = 50

/* eslint-disable @typescript-eslint/no-magic-numbers */
const logLevelNames: LogLevelNames = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

const trimText = (value: string, textLength: number): string => {
  const defaultTextLength = 80
  const textEnd = typeof textLength === 'number' ? textLength : defaultTextLength

  return value?.length > textEnd ? `${value.slice(0, textEnd)}...` : value
}

const state = Vue.reactive({
  totalRows: 0,
  rowsPerPage,
  isLoading: true,
  columns: [
    {
      label: 'Row Ops',
      field: 'rowOps',
      width: '8rem',
      sortable: false,
    },
    {
      label: 'level',
      field: 'level',
    },
    {
      label: 'time',
      field: 'time',
    },
    {
      label: 'name',
      field: 'name',
    },
    {
      label: 'msg',
      field: 'msg',
      sortable: false,
      width: '16rem',
      formatFn: trimText,
    },
    {
      label: 'Data',
      field: 'data',
      sortable: false,
      width: '16rem',
      formatFn: trimText,
    },
  ],
  rows: [] as FormattedLogs | never[],
  showJSONViewer: false,
  jsonViewerData: {} as Log,
})

const generateDataColumn = (log: Log): string => {
  const data = R.omit(['level', 'time', 'name', 'msg'], log)
  return R.isEmpty(data) ? '' : JSON.stringify(data)
}

// eslint-disable-next-line functional/no-let
let localRowsStore: Logs = []

const AdminLogsViewerTable = Vue.defineComponent({
  data() {
    return {
      state,
    }
  },
  // eslint-disable-next-line max-lines-per-function
  mounted() {
    fetch('/admin/api/get-logs')
      .then(checkFetchResponseStatus)
      .then(res => res.json() as Promise<Logs>)
      .then(logs => {
        // eslint-disable-next-line functional/immutable-data
        window.logs = logs
        localRowsStore = logs

        console.info(
          '%c%s',
          'color: green; font-size: 16px;',
          'Logs can be accessed from the console via window.logs'
        )

        const formattedLogs = logs.map(
          log =>
            ({
              level: logLevelNames[log.level],
              time: log.time,
              name: log.name,
              msg: log.msg || '',
              data: generateDataColumn(log),
            } as FormattedLog)
        )

        state.isLoading = false
        state.rows = formattedLogs
      })
      .catch(err => console.error(err))
  },
  methods: {
    inspectRowData(event: Event) {
      const button = event.target as HTMLButtonElement
      const rowIndex = Number(button.dataset['rowIndex'])

      console.info('Row Data:', localRowsStore[rowIndex])

      state.jsonViewerData = localRowsStore[rowIndex] as Log
      state.showJSONViewer = true
    },
    scrollTableToTop() {
      this.$nextTick(() => {
        const tableContainer = $('.vgt-responsive') as HTMLDivElement
        // eslint-disable-next-line functional/immutable-data
        tableContainer.scrollTop = 0
      })
    },
  },
  template: /* html */ `
    <aside class="console-note-aside">
      <small>Note: the logs data is also logged to the browser console for easy inpecting/copying.</small>
    </aside>
    <vue-good-table
      compactMode
      max-height="50vh"
      :isLoading.sync="state.isLoading"
      :total-rows="state.totalRows"
      :columns="state.columns"
      :rows="state.rows"
      :line-numbers="true"
      :search-options="{
        enabled: true
      }"
      :pagination-options="{
        enabled: true,
        mode: 'pages',
        perPage: state.rowsPerPage,
        perPageDropdownEnabled: false,
      }"
      v-on:page-change="scrollTableToTop"
      v-on:sort-change="scrollTableToTop"
      >
      <template #table-actions>
        <a class="download-logs-link" href="/admin/api/download-logs">Download Logs</a>
      </template>
      <template #table-row="props">
        <span v-if="props.column.field == 'rowOps'">
          <button 
            title="Click To Inspect Row Data" 
            @click="inspectRowData"
            v-bind:data-row-index="props.row.originalIndex"
          >Inspect</button>
        </span>
      </template>
  </vue-good-table>
  <div class="json-object-view-wrapper" v-if="state.showJSONViewer">
    <div class="close-button" @click="state.showJSONViewer = false">✕</div>
    <json-viewer :value="state.jsonViewerData" />
  </div>
  `,
})

const app = Vue.createApp(AdminLogsViewerTable)

app
  .use(VueGoodTablePlugin as VGTable)
  .use(JsonViewer as JSONViewer)
  .mount('main')
