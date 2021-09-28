import { Sequelize } from 'sequelize'
import { noop } from '../server/utils'

// import { noop } from '../server/utils'
// import { AdminSettings } from './entities/AdminSettings'
// import { UpdatesTracker } from './entities/UpdatesTracker'
import { initAdminSettingsModel, AdminSettings } from './entities/AdminSettings'
import { initCommentsModel } from './entities/Comments'
import { initFeedsToFetchModel } from './entities/FeedsToFetch'
import { initPostModel } from './entities/Posts'
import { initSubredditsMasterListModel } from './entities/SubredditsMasterList'
import { initUpdatesTrackerModel, UpdatesTracker } from './entities/UpdatesTracker'
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
  const t = await sequelize.transaction()

  AdminSettings.create(defaultAdminSettings)
  UpdatesTracker.create(defaultUpdatesTrackerSettings)

  await t.commit()
}

const createTables = (sequelize: Sequelize): Promise<[void, void, void, void, void, void, void]> =>
  Promise.all([
    initAdminSettingsModel(sequelize),
    initCommentsModel(sequelize),
    initFeedsToFetchModel(sequelize),
    initPostModel(sequelize),
    initSubredditsMasterListModel(sequelize),
    initUpdatesTrackerModel(sequelize),
    initUserModel(sequelize),
  ])

function firstRun(sequelize: Sequelize): Promise<void> {
  return createTables(sequelize).then(() =>
    AdminSettings.findByPk(1).then(result => (result ? noop() : populateTablesOnFirstRun(sequelize)))
  )
}

export { firstRun }
