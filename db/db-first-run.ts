import { Sequelize } from 'sequelize'

import { noop } from '../server/utils'
import { initAdminSettingsModel, AdminSettingsModel } from './entities/AdminSettings'
import { initPostModel } from './entities/Posts/Posts'
import { initSubredditsMasterListModel } from './entities/SubredditsMasterList'
import { initUserModel } from './entities/Users/Users'

const defaultAdminSettings = {
  downloadComments: true,
  numberFeedsOrPostsDownloadsAtOnce: 4, // eslint-disable-line @typescript-eslint/no-magic-numbers
  numberMediaDownloadsAtOnce: 2,
  downloadVideos: false,
  videoDownloadMaxFileSize: '300',
  videoDownloadResolution: '480p',
  updateAllDay: true,
  updateStartingHour: 1,
  updateEndingHour: 5, // eslint-disable-line @typescript-eslint/no-magic-numbers
}

async function populateTablesOnFirstRun(): Promise<void> {
  await AdminSettingsModel.create(defaultAdminSettings)
}

async function createTables(sequelize: Sequelize): Promise<void> {
  await Promise.all([
    initAdminSettingsModel(sequelize),
    initPostModel(sequelize),
    initSubredditsMasterListModel(sequelize),
    initUserModel(sequelize),
  ])
}

function firstRun(sequelize: Sequelize): Promise<void> {
  return createTables(sequelize).then(() =>
    AdminSettingsModel.findByPk(1).then(result => (result ? noop() : populateTablesOnFirstRun()))
  )
}

export { firstRun }
