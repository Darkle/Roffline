import * as Vue from 'vue'
import VueGoodTablePlugin from 'vue-good-table-next'

import { Post } from '../../../db/entities/Posts/Post'
import { User } from '../../../db/entities/Users/User'
import { checkFetchResponseStatus, ignoreScriptTagCompilationWarnings } from '../frontend-utils'

// VueGoodTablePlugin hides bool values if they are false
const boolToString = (bool: boolean): string => `${bool.toString()}`

// VueGoodTablePlugin hides arrays if they are empty
// const arrayString = (arr: string[]): string => JSON.stringify(arr, null, ' ')

type AdminSettings = {
  downloadComments: boolean
  numberMediaDownloadsAtOnce: number
  downloadVideos: boolean
  videoDownloadMaxFileSize: string
  videoDownloadResolution: string
  updateAllDay: boolean
  updateStartingHour: number
  updateEndingHour: number
}

type FeedsToFetch = {
  feed: string
}

type SubredditsMasterListRow = {
  subreddit: string
}

type CommentsFromCommentsDB = { key: string; value: string }

type TopPostsTypeKeys =
  | 'posts_Default'
  | 'topPosts_Day'
  | 'topPosts_Week'
  | 'topPosts_Month'
  | 'topPosts_Year'
  | 'topPosts_All'

type SubredditTableRow = {
  [K in TopPostsTypeKeys]: string | null
}

type DatabaseTypes =
  | User[]
  | Post[]
  | [AdminSettings]
  | CommentsFromCommentsDB[]
  | FeedsToFetch[]
  | SubredditsMasterListRow[]
  | SubredditTableRow[]

type DbTables = string[]

type TableColumnType = {
  label: string
  field: string
  type?: string
  sortable?: boolean
  width?: string
  formatFn?: (value: unknown) => string
}

type TablesColumnsType = {
  [key: string]: TableColumnType[]
}

const tablesColumns = {
  users: [
    {
      label: 'Name',
      field: 'name',
      sortable: true,
    },
    {
      label: 'Subreddits',
      field: 'subreddits',
      sortable: false,
      width: '650px',
    },
    {
      label: 'hideStickiedPosts',
      field: 'hideStickiedPosts',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'infiniteScroll',
      field: 'infiniteScroll',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'darkModeTheme',
      field: 'darkModeTheme',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'Delete Row',
      field: 'deleteRow',
      sortable: false,
    },
  ],
  posts: [
      id: string
  subreddit: string
  author: string
  title: string
  selftext: string
  selftext_html: string
  score: number
  is_self: boolean
  //  created_utc is a unix timestamp (ie the number of seconds since the epoch)
  created_utc: number
  domain: string
  is_video: boolean
  stickied: boolean
  media_has_been_downloaded: boolean
  mediaDownloadTries: number
  post_hint: string
  permalink: string
  url: string
  media: PostMediaKey
  crosspost_parent: string
  commentsDownloaded: boolean
    {
      label: 'Delete Row',
      field: 'deleteRow',
      sortable: false,
    },
  ],
  admin_settings: [
    {
      label: 'Delete Row',
      field: 'deleteRow',
      sortable: false,
    },
  ],
  comments: [
    {
      label: 'Delete Row',
      field: 'deleteRow',
      sortable: false,
    },
  ],
  feeds_to_fetch: [
    {
      label: 'Delete Row',
      field: 'deleteRow',
      sortable: false,
    },
  ],
  subreddits_master_list: [
    {
      label: 'Delete Row',
      field: 'deleteRow',
      sortable: false,
    },
  ],
  subredditTable: [
    {
      label: 'Delete Row',
      field: 'deleteRow',
      sortable: false,
    },
  ],
}

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
