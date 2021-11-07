type AdminSettingsForFrontend = {
  downloadComments: boolean
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
