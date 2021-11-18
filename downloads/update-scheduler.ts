import { db } from '../db/db'
import { AdminSettings } from '../db/entities/AdminSettings'
import { Post } from '../db/entities/Posts/Post'
import { PostsToGet } from '../db/entities/PostsToGet'
import { SubredditsMasterList } from '../db/entities/SubredditsMasterList'
import { mainLogger } from '../logging/logging'
import { isOffline } from './check-if-offline'

const thirtySecondsInMs = 30000

/* eslint-disable functional/no-conditional-statement,functional/no-try-statement,functional/no-let,complexity,array-bracket-newline */

let timer: ReturnType<typeof global.setTimeout>
let downloadsAreRunning = false

const feedsToBeFetched = new Set()
const postsToBeRetrieved = new Set()
const commentsToRetrieved = new Set()
const postsMediaToBeDownloaded = new Set()

function shouldRunNewUpdate({ updateAllDay, updateStartingHour, updateEndingHour }: AdminSettings): boolean {
  if (updateAllDay) return true

  const now = new Date()
  const currentHour = now.getHours()

  if (currentHour === updateStartingHour || currentHour === updateEndingHour) return true

  return currentHour > updateStartingHour && currentHour < updateEndingHour
}

function addThingsToBeDownloadedToSetStores(
  feeds: string[],
  postsToGet: PostsToGet[],
  commentsToGet: Post[],
  mediaToGet: Post[]
): void {
  feeds.forEach(feed => {
    feedsToBeFetched.add(feed)
  })

  postsToGet.forEach(({ id }) => {
    postsToBeRetrieved.add(id)
  })

  commentsToGet.forEach(({ id }) => {
    commentsToRetrieved.add(id)
  })

  mediaToGet.forEach(({ id }) => {
    postsMediaToBeDownloaded.add(id)
  })
}

// eslint-disable-next-line max-lines-per-function
function scheduleUpdates(): void {
  // eslint-disable-next-line max-lines-per-function
  timer = setTimeout(() => {
    clearTimeout(timer)
    // Wait for any file IO in the event loop to finish before starting
    // eslint-disable-next-line @typescript-eslint/no-misused-promises,max-lines-per-function
    setImmediate(async () => {
      try {
        const [adminSettings, weAreOffline] = await Promise.all([db.getAdminSettings(), isOffline()])

        if (weAreOffline || !shouldRunNewUpdate(adminSettings)) return

        const now = new Date()

        mainLogger.trace(`New update. Starting at: ${now.toString()}`)

        const [subsToUpdate, postsToGet, commentsToGet, mediaToGet] = await db.getThingsThatNeedToBeDownloaded()

        const feeds = await thing(subsToUpdate)

        addThingsToBeDownloadedToSetStores(feeds, postsToGet, commentsToGet, mediaToGet)

        // check subreddits_master_list table if any subs feeds need updating, if there are, generate them and add them to feedsToBeFetched
        // check post_to_get if any posts need to be got and add them to postsToBeRetrieved
        // check posts table if any comments still need to be gotten and add them to commentsToRetrieved
        // check posts table to check if any posts media needs to be downloaded (dont forget to check max download tries too) and add them to postsMediaToBeDownloaded
        // If there are subs to update, generate those feeds
        //So when downloading and checking getting something to download next, we favour feedsToBeFetched > postsToBeRetrieved > commentsToRetrieved > postsMediaToBeDownloaded
        // Dont forget to do the concurrency dynamically based on the admin settings
        // When downloading, need to send through the admin settings with that call as will want to know if downloading videos has changed et.al.
        // So on download completed, we check if there is anything more to do in the set()s, if not, we set downloadsAreRunning to false
        // Also on download complete, we update these things:
        // - lastUpdate for a sub in subreddits_master_list needs to be updated with new date for each sub after finished getting all its feeds
        //   - And need to remove it from the feedsToBeFetched Set()
        // - remove post id from posts_to_get table
        // - commentsDownloaded for a post in posts table needs to be set to true
        //   - And need to remove it from the commentsToBeRetrieved Set()
        // - mediaDownloadTries for a post needs to be updated in posts table regardless of success
        //   - On successful update, set media_has_been_downloaded to true in posts table
        // Dont forget to update post_to_get and remove posts we have gotten.

        if (!downloadsAreRunning) {
          downloadsAreRunning = true
          await startSomeDownloads()
        }
      } catch (err) {
        mainLogger.error('Error with downloads', { err })
      } finally {
        /*****
          The require-atomic-updates eslint error here seems to be a false-positive.
          See https://github.com/eslint/eslint/issues/11954 and https://github.com/eslint/eslint/issues/11899
        *****/
        downloadsAreRunning = false // eslint-disable-line require-atomic-updates
      }
    })
    scheduleUpdates()
  }, thirtySecondsInMs)
}

export { scheduleUpdates }
