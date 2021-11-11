// VueGoodTablePlugin hides bool values if they are false
const boolToString = (bool: boolean): string => `${bool.toString()}`

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const trimText = (text: string): string => (text ? `${text.slice(0, 80)}...` : text)

// VueGoodTablePlugin hides arrays if they are empty
// const arrayString = (arr: string[]): string => JSON.stringify(arr, null, ' ')

const tablesColumns = {
  users: [
    {
      label: 'Row Ops',
      field: 'rowOps',
      width: '8rem',
    },
    {
      label: 'Name',
      field: 'name',
    },
    {
      label: 'Subreddits',
      field: 'subreddits',
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
  ],
  posts: [
    {
      label: 'Row Ops',
      field: 'rowOps',
      width: '8rem',
    },
    {
      label: 'id',
      field: 'id',
    },
    {
      label: 'subreddit',
      field: 'subreddit',
    },
    {
      label: 'author',
      field: 'author',
    },
    {
      label: 'title',
      field: 'title',
      width: '16rem',
      formatFn: trimText,
    },
    {
      label: 'selftext',
      field: 'selftext',
      width: '16rem',
      formatFn: trimText,
    },
    {
      label: 'selftext_html',
      field: 'selftext_html',
      width: '16rem',
      formatFn: trimText,
    },
    {
      label: 'score',
      field: 'score',
      type: 'number',
    },
    {
      label: 'is_self',
      field: 'is_self',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'created_utc',
      field: 'created_utc',
      type: 'number',
    },
    {
      label: 'domain',
      field: 'domain',
    },
    {
      label: 'is_video',
      field: 'is_video',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'stickied',
      field: 'stickied',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'media_has_been_downloaded',
      field: 'media_has_been_downloaded',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'mediaDownloadTries',
      field: 'mediaDownloadTries',
      type: 'number',
    },
    {
      label: 'post_hint',
      field: 'post_hint',
    },
    {
      label: 'permalink',
      field: 'permalink',
      width: '16rem',
    },
    {
      label: 'url',
      field: 'url',
      width: '16rem',
    },
    {
      label: 'media',
      field: 'media',
      width: '16rem',
      formatFn: trimText,
    },
    {
      label: 'crosspost_parent',
      field: 'crosspost_parent',
    },
    {
      label: 'commentsDownloaded',
      field: 'commentsDownloaded',
      type: 'boolean',
      formatFn: boolToString,
    },
  ],
  admin_settings: [
    {
      label: 'Row Ops',
      field: 'rowOps',
      width: '8rem',
    },
    {
      label: 'downloadComments',
      field: 'downloadComments',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'numberMediaDownloadsAtOnce',
      field: 'numberMediaDownloadsAtOnce',
      type: 'number',
    },
    {
      label: 'downloadVideos',
      field: 'downloadVideos',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'videoDownloadMaxFileSize',
      field: 'videoDownloadMaxFileSize',
    },
    {
      label: 'videoDownloadResolution',
      field: 'videoDownloadResolution',
    },
    {
      label: 'updateAllDay',
      field: 'updateAllDay',
      type: 'boolean',
      formatFn: boolToString,
    },
    {
      label: 'updateStartingHour',
      field: 'updateStartingHour',
      type: 'number',
    },
    {
      label: 'updateEndingHour',
      field: 'updateEndingHour',
      type: 'number',
    },
  ],
  comments: [
    {
      label: 'Row Ops',
      field: 'rowOps',
      width: '8rem',
    },
    {
      label: 'PostId',
      field: 'key',
    },
    {
      label: 'Comments',
      field: 'value',
      width: '16rem',
      formatFn: trimText,
    },
  ],
  feeds_to_fetch: [
    {
      label: 'Row Ops',
      field: 'rowOps',
      width: '8rem',
    },
    {
      label: 'feed',
      field: 'feed',
    },
  ],
  subreddits_master_list: [
    {
      label: 'Row Ops',
      field: 'rowOps',
      width: '8rem',
    },
    {
      label: 'subreddit',
      field: 'subreddit',
    },
  ],
  subredditTable: [
    {
      label: 'Row Ops',
      field: 'rowOps',
      width: '8rem',
    },
    {
      label: 'posts_Default',
      field: 'posts_Default',
    },
    {
      label: 'topPosts_Day',
      field: 'topPosts_Day',
    },
    {
      label: 'topPosts_Week',
      field: 'topPosts_Week',
    },
    {
      label: 'topPosts_Month',
      field: 'topPosts_Month',
    },
    {
      label: 'topPosts_Year',
      field: 'topPosts_Year',
    },
    {
      label: 'topPosts_All',
      field: 'topPosts_All',
    },
  ],
}

export { tablesColumns }
