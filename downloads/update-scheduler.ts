import { db } from '../db/db'
import { AdminSettings } from '../db/entities/AdminSettings'
import { Post } from '../db/entities/Posts/Post'
import { SubredditsMasterList } from '../db/entities/SubredditsMasterList'
import { mainLogger } from '../logging/logging'
import { isOffline } from './check-if-offline'
import { FeedWithData } from './feeds/generate-feeds'
import { updateSubsFeeds } from './feeds/update-subs-feeds'
import { downloadsStore } from './downloads-store'

/* eslint-disable functional/no-conditional-statement,functional/no-try-statement,functional/no-let,complexity,array-bracket-newline, max-lines-per-function */

const thirtySecondsInMs = 30000
let timer: ReturnType<typeof global.setTimeout>
let downloadsAreRunning = false
let adminSettingsCache: AdminSettings

function shouldRunNewUpdate(): boolean {
  const { updateAllDay, updateStartingHour, updateEndingHour } = adminSettingsCache

  if (updateAllDay) return true

  const now = new Date()
  const currentHour = now.getHours()

  if (currentHour === updateStartingHour || currentHour === updateEndingHour) return true

  return currentHour > updateStartingHour && currentHour < updateEndingHour
}

function addThingsToBeDownloadedToDownloadsStore([subs, commentsToGet, mediaToGet]: [
  subs: SubredditsMasterList[],
  commentsToGet: Post[],
  mediaToGet: Post[]
]): void {
  subs.forEach(({ subreddit }) => {
    downloadsStore.subsToUpdate.add(subreddit)
  })

  commentsToGet.forEach(({ id: postId }) => {
    downloadsStore.commentsToRetrieved.add(postId)
  })

  mediaToGet.forEach(post => {
    if (!downloadsStore.postsMediaToBeDownloaded.has(post.id)) {
      /*****
        We save the whole post in a Map as we need different properties later on
        for checking what to download when doing media downloads.
      *****/
      downloadsStore.postsMediaToBeDownloaded.set(post.id, post)
    }
  })
}

// function removeSuccessfullDownloadsFromDownloadStore(downloadedItems, downloadsType) {
//   downloadsStore
//   // remember to account for if its a Map or a Set here
// }

function startSomeDownloads(): Promise<void | FeedWithData[]> {
  if (downloadsStore.moreSubsToUpdate()) {
    return updateSubsFeeds(adminSettingsCache, downloadsStore.subsToUpdate)
    // .then(savePosts) remember to deduplicate - i think the functions are in feed-processors
    // .then(subsSuccessfullyUpdated =>
    //   removeSuccessfullDownloadsFromDownloadStore(subsSuccessfullyUpdated, 'subsToUpdate')
    // )
  }

  // if (downloadsStore.moreCommentsToRetrieved()) {
  //   return asd(adminSettingsCache, downloadsStore.commentsToRetrieved)
  // .then(commentsRetrieved => removeSuccessfullDownloadFromDownloadStore(commentsRetrieved, 'commentsToRetrieved'))
  // }

  // if (downloadsStore.morePostsMediaToBeDownloaded()) {
  //   return dfgf(adminSettingsCache, downloadsStore.postsMediaToBeDownloaded)
  // .then(mediaDownloads => removeSuccessfullDownloadFromDownloadStore(mediaDownloads, 'postsMediaToBeDownloaded'))
  // }

  // Dont forget to do the concurrency dynamically based on the admin settings
  // When downloading, need to send through the admin settings with that call as will want to know if downloading videos has changed et.al.
  // So on download completed, we check if there is anything more to do in the set()s, if not, we set downloadsAreRunning to false
  // On download completed of feeds, make sure to first clear that subs table first before store all the new data
  // Also on download complete, we update these things:
  // - lastUpdate for a sub in subreddits_master_list needs to be updated with new date for each sub after finished getting all its feeds
  //   - And need to remove it from the feedsToBeFetched Set()
  // - remove post id from posts_to_get table
  // - commentsDownloaded for a post in posts table needs to be set to true
  //   - And need to remove it from the commentsToBeRetrieved Set()
  // - mediaDownloadTries for a post needs to be updated in posts table regardless of success
  //   - On successful update, set media_has_been_downloaded to true in posts table
  // Dont forget to update post_to_get and remove posts we have gotten.
  // Catch and log individual downloads inside their respective downloaders as a single failed download shouldnt bubble up to here

  return downloadsStore.moreToDownload() ? startSomeDownloads() : Promise.resolve()
}

function scheduleUpdates(): void {
  timer = setTimeout(() => {
    clearTimeout(timer)
    // Wait for any file IO in the event loop to finish before starting
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setImmediate(async () => {
      try {
        const [adminSettings, weAreOffline] = await Promise.all([db.getAdminSettings(), isOffline()])

        adminSettingsCache = adminSettings

        if (weAreOffline || !shouldRunNewUpdate()) return

        mainLogger.trace(`New update. Starting at: ${new Date().toString()}`)

        if (!downloadsAreRunning) {
          downloadsAreRunning = true

          await db.getThingsThatNeedToBeDownloaded().then(addThingsToBeDownloadedToDownloadsStore)

          await startSomeDownloads().then(() => {
            downloadsAreRunning = false
          })
        }
      } catch (err) {
        mainLogger.error('Error with downloads:', { err })
        /*****
          The require-atomic-updates eslint error here seems to be a false-positive.
          See https://github.com/eslint/eslint/issues/11899
        *****/
        downloadsAreRunning = false // eslint-disable-line require-atomic-updates
      }
    })
    scheduleUpdates()
  }, thirtySecondsInMs)
}

export { scheduleUpdates }
