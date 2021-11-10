// VueGoodTablePlugin hides bool values if they are false
const boolToString = (bool: boolean): string => `${bool.toString()}`

// VueGoodTablePlugin hides arrays if they are empty
// const arrayString = (arr: string[]): string => JSON.stringify(arr, null, ' ')

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
    //     id: string
    // subreddit: string
    // author: string
    // title: string
    // selftext: string
    // selftext_html: string
    // score: number
    // is_self: boolean
    // //  created_utc is a unix timestamp (ie the number of seconds since the epoch)
    // created_utc: number
    // domain: string
    // is_video: boolean
    // stickied: boolean
    // media_has_been_downloaded: boolean
    // mediaDownloadTries: number
    // post_hint: string
    // permalink: string
    // url: string
    // media: PostMediaKey
    // crosspost_parent: string
    // commentsDownloaded: boolean
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

export { tablesColumns }
