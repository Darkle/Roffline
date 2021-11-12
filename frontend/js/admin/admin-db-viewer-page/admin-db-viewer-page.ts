import * as Vue from 'vue'
import VueGoodTablePlugin from 'vue-good-table-next'
import debounce from 'lodash.debounce'
import JsonViewer from 'vue3-json-viewer'

import {
  DbTables,
  TableColumnType,
  DatabaseTypes,
  TablesColumnsType,
  JsonViewerData,
  CommentsFromCommentsDB,
} from './admin-db-viewer-page-types'
import { checkFetchResponseStatus, ignoreScriptTagCompilationWarnings, $ } from '../../frontend-utils'
import { tablesColumns } from './table-columns'
import { CommentsWithMetadata } from '../../../../db/entities/Comments'

const defaultNumRowsPerPage = 50
const commentsNumRowsPerPage = 200

const state = Vue.reactive({
  totalRows: 0,
  rowsPerPage: defaultNumRowsPerPage,
  isLoading: true,
  searchTerm: '',
  currentTable: '',
  currentPage: 1,
  dbTables: [] as DbTables,
  columns: [] as TableColumnType[],
  rows: [] as DatabaseTypes,
  showJSONViewer: false,
  jsonViewerData: {} as JsonViewerData,
})

type PageChangeParams = {
  currentPage: number
  prevPage: number
  currentPerPage: number
  total: number
}

// eslint-disable-next-line functional/no-let
let localRowsStore: DatabaseTypes = []

const AdminDBViewerTable = Vue.defineComponent({
  data() {
    return {
      state,
    }
  },
  created() {
    const delay = 500
    // eslint-disable-next-line functional/immutable-data
    this['onSearch'] = debounce(({ searchTerm }: { searchTerm: string }) => {
      state.isLoading = true
      /*****
        If doing a search in comments db, because of limitations of comments db search,
        we cant return the total count for a search, so we just show 200 results and hope thats enough.
      *****/
      state.rowsPerPage = state.currentTable === 'comments' ? commentsNumRowsPerPage : defaultNumRowsPerPage
      state.searchTerm = searchTerm
      this.fetchTableData()
    }, delay)
  },
  mounted() {
    fetch('/admin/api/list-db-tables')
      .then(checkFetchResponseStatus)
      .then(res => res.json() as Promise<{ name: string }[]>)
      .then(dbTables => {
        console.log('DB Tables:', dbTables)
        state.isLoading = false
        state.dbTables = dbTables.map(dbTable => dbTable.name)
        state.currentTable = state.dbTables[0] as string

        this.fetchTableData()
      })
  },
  methods: {
    // eslint-disable-next-line max-lines-per-function
    fetchTableData(newTable = false) {
      const searching = state.searchTerm.length > 0

      fetch(
        `/admin/api/get-paginated-table-data?tableName=${state.currentTable}&page=${state.currentPage}${
          searching ? `&searchTerm=${state.searchTerm.trim()}` : ''
        }`
      )
        .then(checkFetchResponseStatus)
        .then(res => res.json() as Promise<{ rows: DatabaseTypes; count: number }>)
        .then(paginatedTableData => {
          console.log(
            `Paginated Table Data For "${state.currentTable}" table, page ${state.currentPage} (50 rows or less):`,
            paginatedTableData
          )

          localRowsStore = paginatedTableData.rows

          const columns = state.currentTable.startsWith('subreddit_table_')
            ? tablesColumns.subredditTable
            : ((tablesColumns as TablesColumnsType)[state.currentTable] as TableColumnType[])

          // dont need the Row Ops column if no rows, makes it confusing
          if (paginatedTableData.rows.length === 0) columns.shift() // eslint-disable-line functional/no-conditional-statement,functional/immutable-data

          /*****
            For some reason vue-good-table-next errors when switching tables and assigning the new rows data if the new
            table has less columns. Adding a reset here and a small tick before update to fix that.
          *****/
          this.resetRowData()

          this.$nextTick(() => {
            state.columns = columns
            state.rows = paginatedTableData.rows
            state.totalRows = paginatedTableData.count
          })
        })
        .then(() => {
          state.isLoading = false
          this.scrollTableToTop()
          // eslint-disable-next-line functional/no-conditional-statement
          if (newTable) {
            // Clear any search in search input if we have loaded a new table.
            this.resetSearchInput()
          }
        })
    },
    scrollTableToTop() {
      const tableContainer = $('.vgt-responsive') as HTMLDivElement
      // eslint-disable-next-line functional/immutable-data
      tableContainer.scrollTop = 0
    },
    resetRowData() {
      state.columns = []
      state.rows = []
      state.totalRows = 0
    },
    resetSearchInput() {
      this.$nextTick(() => {
        const searchInput = $('input[id^="vgt-search-"]') as HTMLInputElement
        // eslint-disable-next-line functional/immutable-data
        searchInput.value = ''
      })
    },
    dbSelectHandler(event: Event) {
      const selectElem = event?.target as HTMLSelectElement
      const tableName = selectElem.value as string
      const newTable = true

      state.isLoading = true
      state.currentTable = tableName
      state.searchTerm = ''
      state.currentPage = 1

      this.fetchTableData(newTable)
    },
    inspectRowData(event: Event) {
      const button = event.target as HTMLButtonElement
      const rowIndex = Number(button.dataset['rowIndex'])

      console.log('Row Data:', localRowsStore[rowIndex])

      // eslint-disable-next-line functional/no-conditional-statement
      if (state.currentTable === 'comments') {
        const commentRowData = localRowsStore[rowIndex] as CommentsFromCommentsDB
        const comments = JSON.parse(commentRowData.value) as CommentsWithMetadata

        state.jsonViewerData = {
          postId: commentRowData.key,
          comments,
        }
        state.showJSONViewer = true
        return
      }

      state.jsonViewerData = localRowsStore[rowIndex] as JsonViewerData
      state.showJSONViewer = true
    },
    onPageChange(params: PageChangeParams) {
      state.currentPage = params.currentPage

      // The comments table pages take longer to load.
      // eslint-disable-next-line functional/no-conditional-statement
      if (state.currentTable === 'comments') {
        state.isLoading = true
      }

      this.fetchTableData()
    },
  },
  template: /* html */ `
    <aside class="console-note-aside">
      <small>Note: this data is also logged to the browser console for easier inpecting/copying.</small>
    </aside>
    <label for="table-select">Select a DB table:</label>
    <select name="table-select" id="table-select" @change="dbSelectHandler">
      <template v-for="table in state.dbTables">
        <option v-bind:value="table">{{table}}</option>
      </template>
    </select>      
    <vue-good-table
      mode="remote"
      compactMode
      max-height="50vh"
      :isLoading.sync="state.isLoading"
      :totalRows="state.totalRows"
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
        setCurrentPage:state.currentPage
      }"
      :sort-options="{
        enabled: false,
      }"
      v-on:page-change="onPageChange"
      v-on:search="onSearch"
      >
      <template #table-row="props">
        <span v-if="props.column.field == 'rowOps'">
          <button 
            title="Click To Inspect Row Data" 
            @click="inspectRowData"
            v-bind:data-row-index="props.index"
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

const app = Vue.createApp(AdminDBViewerTable)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueGoodTablePlugin).use(JsonViewer).mount('main')
