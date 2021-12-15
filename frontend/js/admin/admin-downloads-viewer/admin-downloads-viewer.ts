import * as Vue from 'vue'

import { ignoreScriptTagCompilationWarnings } from '../../frontend-utils'
import { state } from './admin-downloads-viewer-store'

const AdminDownloadsViewer = Vue.defineComponent({
  data() {
    return {
      state,
    }
  },
  mounted() {
    // fetch('/admin/api/get-users')
    //   .then(checkFetchResponseStatus)
    //   .then(res => res.json() as Promise<User[]>)
    //   .then(users => {
    //     console.info(users)
    //     state.rows = users as User[]
    //   })
    //   .catch(err => console.error(err))
  },
  methods: {},
  template: /* html */ `

  `,
})

const app = Vue.createApp(AdminDownloadsViewer)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('main')
