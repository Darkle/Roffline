type AdminSettingsForFrontend = {
  downloadComments: boolean
  numberFeedsOrPostsDownloadsAtOnce: number
  numberMediaDownloadsAtOnce: number
  downloadVideos: boolean
  videoDownloadMaxFileSize: string
  videoDownloadResolution: string
  updateAllDay: boolean
  updateStartingHour: number
  updateEndingHour: number
  downloadImages: boolean
  downloadArticles: boolean
}

type AdminSettingsPageWindowWithProps = {
  adminSettings: AdminSettingsForFrontend
} & Window

export { AdminSettingsPageWindowWithProps, AdminSettingsForFrontend }
