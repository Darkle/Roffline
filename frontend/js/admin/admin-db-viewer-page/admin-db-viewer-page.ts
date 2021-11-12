import * as Vue from 'vue'
import VueGoodTablePlugin from 'vue-good-table-next'

import { DbTables, TableColumnType, DatabaseTypes, TablesColumnsType } from './admin-db-viewer-page-types'
import { checkFetchResponseStatus, ignoreScriptTagCompilationWarnings, $ } from '../../frontend-utils'
import { tablesColumns } from './table-columns'

const state = Vue.reactive({
  totalRows: 0,
  isLoading: true,
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
  mounted() {
    fetch('/admin/api/list-db-tables')
      .then(checkFetchResponseStatus)
      .then(res => res.json() as Promise<{ name: string }[]>)
      .then(dbTables => {
        console.log('DB Tables:', dbTables)
        state.isLoading = false
        state.dbTables = dbTables.map(dbTable => dbTable.name)

        this.fetchTableData(state.dbTables[0] as string)
      })
  },
  methods: {
    // eslint-disable-next-line max-lines-per-function
    fetchTableData(tableName: string, page = 1, searchTerm = null) {
      fetch(
        `/admin/api/get-paginated-table-data?tableName=${tableName}&page=${page}${
          searchTerm ? `&searchTerm=${searchTerm as string}` : ''
        }`
      )
        .then(checkFetchResponseStatus)
        .then(res => res.json() as Promise<{ rows: DatabaseTypes; totalRowsCount: number }>)
        .then(paginatedTableData => {
          console.log(
            `Paginated Table Data For "${tableName}" table, page ${page} (50 rows or less):`,
            paginatedTableData
          )

          const columns = tableName.startsWith('subreddit_table_')
            ? tablesColumns.subredditTable
            : ((tablesColumns as TablesColumnsType)[tableName] as TableColumnType[])

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
            state.totalRows = paginatedTableData.totalRowsCount
          })
        })
        .then(this.scrollTableToTop)
        .then(() => {
          state.isLoading = false
        })
    },
    scrollTableToTop() {
      const tableContainer = $('.vgt-responsive') as HTMLDivElement
      // eslint-disable-next-line functional/immutable-data
      tableContainer.scrollTop = 0
    },
    dbSelectHandler(event: Event) {
      const selectElem = event?.target as HTMLSelectElement
      const tableName = selectElem.value as string

      state.isLoading = true
      state.currentTable = tableName

      this.fetchTableData(tableName)
    },
    rowOps() {
      console.log('rowOps')
    },
    onPageChange(params: PageChangeParams) {
      state.currentPage = params.currentPage

      // I dont know why but the comments table pages take longer to load.
      // eslint-disable-next-line functional/no-conditional-statement
      if (state.currentTable === 'comments') {
        state.isLoading = true
      }

      this.fetchTableData(state.currentTable, params.currentPage)
    },
    onSearch() {
      //TODO:debounce
      console.log('onSearch')
      // this.fetchTableData(state.currentTable, state.currentPage, searchTerm)
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
        perPage: 50,
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
            @click="rowOps"
            v-bind:data-row-index="props.row.index"
          >Delete</button>
        </span>
      </template>
  </vue-good-table>
  `,
})

const app = Vue.createApp(AdminDBViewerTable)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueGoodTablePlugin).mount('main')
