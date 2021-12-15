import * as Vue from 'vue'
import { Tabulator } from 'tabulator-tables'

import { checkFetchResponseStatus, ignoreScriptTagCompilationWarnings } from '../../frontend-utils'
import { state } from './admin-downloads-viewer-store'
import type { PostWithMediaDownloadInfo } from '../../../../downloads/media/media-downloads-viewer-organiser'

type Download = PostWithMediaDownloadInfo

const AdminDownloadsViewer = Vue.defineComponent({
  data() {
    return {
      state,
    }
  },
  mounted() {
    fetch('/admin/api/get-users')
      .then(checkFetchResponseStatus)
      .then(res => res.json() as Promise<Download[]>)
      .then(downloads => {
        console.info(downloads)
        state.downloads = downloads as Download[]
        /*****
          I dont know why eslint thinks Tabulator is an any type. Typescript itself thinks its a Tabulator type.
        *****/
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
        state.table = new Tabulator('#downloads-container', {
          data: downloads,
        })
      })
      .catch(err => console.error(err))
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

export { Download }
