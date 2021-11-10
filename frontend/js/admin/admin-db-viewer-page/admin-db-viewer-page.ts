import * as Vue from 'vue'
import VueGoodTablePlugin from 'vue-good-table-next'

import { DbTables, TableColumnType, DatabaseTypes, TablesColumnsType } from './admin-db-viewer-page-types'
import { checkFetchResponseStatus, ignoreScriptTagCompilationWarnings } from '../../frontend-utils'
import { tablesColumns } from './table-columns'

const state = Vue.reactive({
  totalRows: 0,
  isLoading: true,
  dbTables: [] as DbTables,
  columns: [] as TableColumnType[],
  rows: [] as DatabaseTypes,
})

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

        state.dbTables = dbTables.map(dbTable => dbTable.name)

        this.fetchTableData(state.dbTables[0] as string)
      })
  },
  methods: {
    // eslint-disable-next-line max-lines-per-function
    fetchTableData(tableName: string, page = 1, searchTerm = null) {
      state.isLoading = true

      fetch(
        `/admin/api/get-paginated-table-data?tableName=${tableName}&page=${page}${
          searchTerm ? `&searchTerm=${searchTerm as string}` : ''
        }`
      )
        .then(checkFetchResponseStatus)
        .then(res => res.json() as Promise<{ rows: DatabaseTypes; totalRowsCount: number }>)
        .then(paginatedTableData => {
          console.log(`Paginated Table Data For "${tableName}" table (50 rows or less):`, paginatedTableData)

          const columns = tableName.startsWith('subreddit_table_')
            ? tablesColumns.subredditTable
            : ((tablesColumns as TablesColumnsType)[tableName] as TableColumnType[])

          state.isLoading = false
          state.columns = columns
          state.rows = paginatedTableData.rows
          state.totalRows = paginatedTableData.totalRowsCount
        })
    },
    dbSelectHandler(event: Event) {
      const selectElem = event?.target as HTMLSelectElement
      const tableName = selectElem.value as string

      this.fetchTableData(tableName)
    },
    deleteRow() {
      console.log('deleteRow')
    },
    onPageChange() {
      console.log('onPageChange')
    },
    onSortChange() {
      console.log('onSortChange')
    },
    onColumnFilter() {
      console.log('onColumnFilter')
    },
    onSearch() {
      //TODO:debounce
      console.log('onSearch')
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
      :totalRows="state.totalRows"
      :columns="state.columns"
      :rows="state.rows"
      :fixed-header="true"
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
      :isLoading.sync="state.isLoading"
      v-on:page-change="onPageChange"
      v-on:sort-change="onSortChange"
      v-on:column-filter="onColumnFilter"
      v-on:search="onSearch"
      >
      <template #table-row="props">
        <span v-if="props.column.field == 'deleteRow'">
        <!-- TODO:v-bind:data-row-index="props.row.index" may need to be changed  --> 
          <button 
            title="Click To Delete Row" 
            @click="deleteRow"
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
