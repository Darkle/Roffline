import { getConnection } from 'typeorm'

import { noop } from '../server/utils'
import { AdminSettings } from './entities/AdminSettings'
import { UpdatesTracker } from './entities/UpdatesTracker'

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
  unique: 0,
  lastUpdateDateAsString: new Date().toString(),
}

function firstRun(): Promise<void> {
  return AdminSettings.findOne(1).then(result =>
    result
      ? noop()
      : getConnection().transaction(async transactionalEntityManager => {
          const adminSettings = AdminSettings.create({
            ...defaultAdminSettings,
          })
          const updatesTrackerSettings = UpdatesTracker.create({
            ...defaultUpdatesTrackerSettings,
          })

          await transactionalEntityManager.save(adminSettings)
          await transactionalEntityManager.save(updatesTrackerSettings)
        })
  )
}

export { firstRun }
