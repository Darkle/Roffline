import { db } from '../../db/db'

function updateSubsFeeds(adminSettings, subsToUpdate) {
  return fetchFeeds(adminSettings, subsToUpdate)
    .then(db.batchAddSubredditsPostIdReferences)
    .then(updateSubsLastUpdate)
}

export { updateSubsFeeds }
