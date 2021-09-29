import { Sequelize } from 'sequelize'
import { noop } from '../server/utils'

// import { noop } from '../server/utils'
// import { AdminSettings } from './entities/AdminSettings'
// import { UpdatesTracker } from './entities/UpdatesTracker'
import { initAdminSettingsModel, AdminSettingsModel } from './entities/AdminSettings'
// import { initCommentsModel } from './entities/Comments'
import { initFeedsToFetchModel } from './entities/FeedsToFetch'
import { initPostModel } from './entities/Posts'
import { initSubredditsMasterListModel } from './entities/SubredditsMasterList'
import { initUpdatesTrackerModel, UpdatesTrackerModel } from './entities/UpdatesTracker'
import { initUserModel } from './entities/Users'

const defaultAdminSettings = {
  downloadComments: true,
  numberDownloadsAtOnce: 2,
  downloadVideos: false,
  videoDownloadMaxFileSize: '300',
  videoDownloadResolution: '480p',
  updateAllDay: true,
  updateStartingHour: 1,
  updateEndingHour: 5, // eslint-disable-line @typescript-eslint/no-magic-numbers
}

const defaultUpdatesTrackerSettings = {
  lastUpdateDateAsString: new Date().toString(),
}

async function populateTablesOnFirstRun(sequelize: Sequelize): Promise<void> {
  await sequelize.transaction(async transaction => {
    await Promise.all([
      AdminSettingsModel.create(defaultAdminSettings, { transaction }),
      UpdatesTrackerModel.create(defaultUpdatesTrackerSettings, { transaction }),
    ])
  })
}

async function createTables(sequelize: Sequelize): Promise<void> {
  await Promise.all([
    initAdminSettingsModel(sequelize),
    // initCommentsModel(sequelize),
    initFeedsToFetchModel(sequelize),
    initPostModel(sequelize),
    initSubredditsMasterListModel(sequelize),
    initUpdatesTrackerModel(sequelize),
    initUserModel(sequelize),
  ])
}

function firstRun(sequelize: Sequelize): Promise<void> {
  return createTables(sequelize).then(() =>
    AdminSettingsModel.findByPk(1).then(result => (result ? noop() : populateTablesOnFirstRun(sequelize)))
  )
}

export { firstRun }
