import * as Vue from 'vue'
import VueGoodTablePlugin from 'vue-good-table-next'

import { User } from '../../../db/entities/Users/User'
import { checkFetchResponseStatus, ignoreScriptTagCompilationWarnings } from '../frontend-utils'

// VueGoodTablePlugin hides bool values if they are false
const boolToString = (bool: boolean): string => `${bool.toString()}`

const state = Vue.reactive({
  columns: [
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
      // VueGoodTablePlugin hides arrays if they are empty
      formatFn: (arr: string[]): string => JSON.stringify(arr, null, ' '),
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
      label: 'Delete User',
      field: 'deleteUser',
      sortable: false,
    },
  ],
  rows: [] as User[],
})

const AdminUsersTable = Vue.defineComponent({
  data() {
    return {
      state,
    }
  },
  mounted() {
    fetch('/admin/api/get-users')
      .then(checkFetchResponseStatus)
      .then(res => res.json() as Promise<User[]>)
      .then(users => {
        state.rows = users as User[]
      })
      .catch(err => console.error(err))
  },
  methods: {},
  template: /* html */ `
    <vue-good-table
      :columns="state.columns"
      :rows="state.rows"
      :fixed-header="true"
      :line-numbers="true"
      :search-options="{
        enabled: true
      }"
      :pagination-options="{
        enabled: true,
        mode: 'pages'
      }"
      compactMode
      >
    <template #table-row="props">
      <span v-if="props.column.field == 'deleteUser'">
        <button title="Click To Delete User">Delete</button>
      </span>
    </template>
  </vue-good-table>
  `,
})

const app = Vue.createApp(AdminUsersTable)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueGoodTablePlugin).mount('main')
