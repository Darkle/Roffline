import { Sequelize } from 'sequelize'

// import { noop } from '../server/utils'
// import { AdminSettings } from './entities/AdminSettings'
// import { UpdatesTracker } from './entities/UpdatesTracker'
import { initAdminSettingsModel } from './entities/AdminSettings'
import { initCommentsModel } from './entities/Comments'
import { initFeedsToFetchModel } from './entities/FeedsToFetch'
import { initPostModel } from './entities/Posts'
import { initSubredditsMasterListModel } from './entities/SubredditsMasterList'
import { initUpdatesTrackerModel } from './entities/UpdatesTracker'
import { initUserModel } from './entities/Users'

// const defaultAdminSettings = {
//   downloadComments: true,
//   numberDownloadsAtOnce: 2,
//   downloadVideos: false,
//   videoDownloadMaxFileSize: '300',
//   videoDownloadResolution: '480p',
//   updateAllDay: true,
//   updateStartingHour: 1,
//   updateEndingHour: 5, // eslint-disable-line @typescript-eslint/no-magic-numbers
// }

// const defaultUpdatesTrackerSettings = {
//   unique: 0,
//   lastUpdateDateAsString: new Date().toString(),
// }

function firstRun(sequelize: Sequelize): Promise<[void, void, void, void, void, void, void]> {
  return Promise.all([
    initAdminSettingsModel(sequelize),
    initCommentsModel(sequelize),
    initFeedsToFetchModel(sequelize),
    initPostModel(sequelize),
    initSubredditsMasterListModel(sequelize),
    initUpdatesTrackerModel(sequelize),
    initUserModel(sequelize),
  ])
  // return AdminSettings.findOne(1).then(result =>
  //   result
  //     ? noop()
  //     : getConnection().transaction(async transactionalEntityManager => {
  //         const adminSettings = AdminSettings.create({
  //           ...defaultAdminSettings,
  //         })
  //         const updatesTrackerSettings = UpdatesTracker.create({
  //           ...defaultUpdatesTrackerSettings,
  //         })
  //         await transactionalEntityManager.save(adminSettings)
  //         await transactionalEntityManager.save(updatesTrackerSettings)
  //       })
  // )
}

export { firstRun }
