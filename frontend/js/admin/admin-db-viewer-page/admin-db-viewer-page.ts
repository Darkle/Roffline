import * as Vue from 'vue'
import VueGoodTablePlugin from 'vue-good-table-next'
import debounce from 'lodash.debounce'

import { DbTables, TableColumnType, DatabaseTypes, TablesColumnsType } from './admin-db-viewer-page-types'
import { checkFetchResponseStatus, ignoreScriptTagCompilationWarnings, $ } from '../../frontend-utils'
import { tablesColumns } from './table-columns'

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
})

type PageChangeParams = {
  currentPage: number
  prevPage: number
  currentPerPage: number
  total: number
}

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
      this.fetchTableData(state.currentPage)
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
    fetchTableData(page = 1, newTable = false) {
      const searching = state.searchTerm.length > 0

      fetch(
        `/admin/api/get-paginated-table-data?tableName=${state.currentTable}&page=${page}${
          searching ? `&searchTerm=${state.searchTerm.trim()}` : ''
        }`
      )
        .then(checkFetchResponseStatus)
        .then(res => res.json() as Promise<{ rows: DatabaseTypes; count: number }>)
        .then(paginatedTableData => {
          console.log(
            `Paginated Table Data For "${state.currentTable}" table, page ${page} (50 rows or less):`,
            paginatedTableData
          )

          const columns = state.currentTable.startsWith('subreddit_table_')
            ? tablesColumns.subredditTable
            : ((tablesColumns as TablesColumnsType)[state.currentTable] as TableColumnType[])

          // dont need the Row Ops column if no rows, makes it confusing
          if (paginatedTableData.rows.length === 0) columns.shift() // eslint-disable-line functional/no-conditional-statement,functional/immutable-data

          /*****
            For some reason vue-good-table-next errors when switching tables and assigning the new rows data if the new
            table has less columns. Adding a reset here and a small tick before update to fix that.
          *****/
          state.columns = []
          state.rows = []
          state.totalRows = 0

          this.$nextTick(() => {
            state.columns = columns
            state.rows = paginatedTableData.rows
            state.totalRows = paginatedTableData.count
          })
        })
        .then(this.scrollTableToTop)
        .then(() => {
          state.isLoading = false
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
      const page = 1

      state.isLoading = true
      state.currentTable = tableName
      state.searchTerm = ''

      this.fetchTableData(page, newTable)
    },
    deleteRow() {
      console.log('deleteRow')
    },
    inspectRowData() {
      console.log('inspectRowData')
    },
    onPageChange(params: PageChangeParams) {
      state.currentPage = params.currentPage

      // The comments table pages take longer to load.
      // eslint-disable-next-line functional/no-conditional-statement
      if (state.currentTable === 'comments') {
        state.isLoading = true
      }

      this.fetchTableData(params.currentPage)
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
      }"
      :sort-options="{
        enabled: false,
      }"
      v-on:page-change="onPageChange"
      v-on:search="onSearch"
      >
      <template #table-row="props">
        <span v-if="props.column.field == 'rowOps'">
        <!-- TODO:v-bind:data-row-index="props.row.index" may need to be changed  --> 
          <button 
            title="Click To Delete Row" 
            @click="deleteRow"
            v-bind:data-row-index="props.row.index"
          >Delete Row</button>
          <button 
            title="Click To Inspect Row Data" 
            @click="inspectRowData"
            v-bind:data-row-index="props.row.index"
          >Inspect Data</button>
        </span>
      </template>
  </vue-good-table>
  `,
})

const app = Vue.createApp(AdminDBViewerTable)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueGoodTablePlugin).mount('main')
