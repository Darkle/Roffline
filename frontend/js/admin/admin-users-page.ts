import * as Vue from 'vue'
import VueGoodTablePlugin from 'vue-good-table-next'

import { User } from '../../../db/entities/Users/User'
import { checkFetchResponseStatus, Fetcher, ignoreScriptTagCompilationWarnings } from '../frontend-utils'

// VueGoodTablePlugin hides bool values if they are false
const boolToString = (bool: boolean): string => `${bool.toString()}`

const state = Vue.reactive({
  columns: [
    {
      label: 'Name',
      field: 'name',
    },
    {
      label: 'Subreddits',
      field: 'subreddits',
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
      width: '8rem',
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
        console.info(users)
        state.rows = users as User[]
      })
      .catch(err => console.error(err))
  },
  methods: {
    removeUserFromRows(userName: string) {
      return state.rows.filter(row => row.name !== userName)
    },
    deleteUser(event: Event): void {
      const buttonElem = event.target as HTMLButtonElement
      const userName = buttonElem.dataset['userName']?.trim() as string

      const deleteUserConfirmation = confirm(`Delete User "${userName}"?`) // eslint-disable-line no-alert

      // eslint-disable-next-line functional/no-conditional-statement
      if (!deleteUserConfirmation) return

      Fetcher.deleteJSON('/admin/api/delete-user', { userToDelete: userName })
        .then(() => {
          state.rows = this.removeUserFromRows(userName)
        })
        .catch(err => console.error(err))
    },
  },
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
      :sort-options="{
        enabled: false,
      }"
      compactMode
      >
      <template #table-row="props">
        <span v-if="props.column.field == 'deleteUser'">
          <button 
            title="Click To Delete User" 
            @click="deleteUser"
            v-bind:data-user-name="props.row.name"
          >Delete</button>
        </span>
      </template>
  </vue-good-table>
  `,
})

const app = Vue.createApp(AdminUsersTable)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueGoodTablePlugin).mount('main')
