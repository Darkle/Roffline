const sqliteBoolToString = (sqliteBoolean: number): string => `${sqliteBoolean === 0 ? 'false' : 'true'}`

const trimText = (text: string, textLength: number): string => {
  const defaultTextLength = 80
  const textEnd = typeof textLength === 'number' ? textLength : defaultTextLength
  return text ? `${text.slice(0, textEnd)}...` : text
}

const rowOpsColumn = {
  label: 'Row Ops',
  field: 'rowOps',
  width: '8rem',
}

const tablesColumns = {
  users: [
    rowOpsColumn,
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
      formatFn: sqliteBoolToString,
    },
    {
      label: 'infiniteScroll',
      field: 'infiniteScroll',
      type: 'boolean',
      formatFn: sqliteBoolToString,
    },
    {
      label: 'darkModeTheme',
      field: 'darkModeTheme',
      type: 'boolean',
      formatFn: sqliteBoolToString,
    },
  ],
  posts: [
    rowOpsColumn,
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
      formatFn: sqliteBoolToString,
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
      formatFn: sqliteBoolToString,
    },
    {
      label: 'stickied',
      field: 'stickied',
      type: 'boolean',
      formatFn: sqliteBoolToString,
    },
    {
      label: 'media_has_been_downloaded',
      field: 'media_has_been_downloaded',
      type: 'boolean',
      formatFn: sqliteBoolToString,
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
      formatFn: sqliteBoolToString,
    },
  ],
  admin_settings: [
    {
      label: 'downloadComments',
      field: 'downloadComments',
      type: 'boolean',
      formatFn: sqliteBoolToString,
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
      formatFn: sqliteBoolToString,
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
      formatFn: sqliteBoolToString,
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
    rowOpsColumn,
    {
      label: 'PostId',
      field: 'key',
    },
    {
      label: 'Comments',
      field: 'value',
      width: '36rem',
      formatFn: (val: string): string => {
        const textLength = 120
        return trimText(val, textLength)
      },
    },
  ],
  feeds_to_fetch: [
    {
      label: 'feed',
      field: 'feed',
    },
  ],
  subreddits_master_list: [
    {
      label: 'subreddit',
      field: 'subreddit',
    },
  ],
  subredditTable: [
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
