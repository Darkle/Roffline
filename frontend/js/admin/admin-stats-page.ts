import * as R from 'ramda'
import * as Vue from 'vue'

import { Fetcher } from '../frontend-utils'

const prependString = R.curry((str: string, val: string) => `${str}${val}`)

const convertRawStatsToText = R.evolve({
  cpuUsage: (rss: string) => `CPU Usage: ${rss}%`,
  rss: prependString('Memory Usage: '),
  dbSize: prependString('DB Size: '),
  commentsDBSize: prependString('Comments DB Size: '),
  postsWithMediaStillToDownload: prependString('Posts With Media Still To Download: '),
  postsMediaFolderSize: prependString('Media Folder Size: '),
  uptime: prependString('Uptime: '),
  numSubs: prependString('Subreddits Tracked: '),
  numPosts: prependString('Posts: '),
  numUsers: prependString('Users: '),
})

const state = Vue.reactive({
  cpuUsage: '',
  rss: '',
  dbSize: '',
  commentsDBSize: '',
  postsWithMediaStillToDownload: '',
  postsMediaFolderSize: '',
  uptime: '',
  numSubs: '',
  numPosts: '',
  numUsers: '',
})

const AdminStatsPage = Vue.defineComponent({
  data() {
    return state
  },
  mounted() {
    const signupForm = this.$refs['statsList'] as HTMLUListElement
    signupForm.removeAttribute('x-cloak')

    Fetcher.getJSON('/admin/api/get-stats')
      .then(convertRawStatsToText)
      .then(formattedStats => {
        state.cpuUsage = formattedStats['cpuUsage'] as string
        state.rss = formattedStats['rss'] as string
        state.dbSize = formattedStats['dbSize'] as string
        state.commentsDBSize = formattedStats['commentsDBSize'] as string
        state.postsWithMediaStillToDownload = formattedStats['postsWithMediaStillToDownload'] as string
        state.postsMediaFolderSize = formattedStats['postsMediaFolderSize'] as string
        state.uptime = formattedStats['uptime'] as string
        state.numSubs = formattedStats['numSubs'] as string
        state.numPosts = formattedStats['numPosts'] as string
        state.numUsers = formattedStats['numUsers'] as string
      })
      .catch(err => console.error(err))
  },
  methods: {},
})

const app = Vue.createApp(AdminStatsPage)

app.mount('main')
