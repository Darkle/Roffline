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
}

type AdminSettingsPageWindowWithProps = {
  adminSettings: AdminSettingsForFrontend
} & Window

export { AdminSettingsPageWindowWithProps, AdminSettingsForFrontend }
