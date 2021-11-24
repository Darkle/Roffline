import { db } from '../db/db'
import { AdminSettings } from '../db/entities/AdminSettings'
import { Post } from '../db/entities/Posts/Post'
import { SubredditsMasterList } from '../db/entities/SubredditsMasterList'
import { mainLogger } from '../logging/logging'
import { isOffline } from './check-if-offline'
import { FeedWithData } from './feeds/generate-feeds'
import { updateSubsFeeds } from './feeds/update-subs-feeds'
import { downloadsStore, removeSuccessfullDownloadsFromDownloadStore } from './downloads-store'
import { savePosts } from './posts/save-posts'
import { removeAnyPostsNoLongerNeeded } from './posts/posts-removal'
// import { getCommentsForPosts } from './comments/get-comments'

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
    downloadsStore.commentsToRetrieve.add(postId)
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

async function startSomeDownloads(): Promise<void | FeedWithData[]> {
  if (downloadsStore.moreSubsToUpdate()) {
    return (
      updateSubsFeeds(adminSettingsCache, downloadsStore.subsToUpdate)
        .then(savePosts)
        .then((subsSuccessfullyUpdated: string[]) => {
          removeSuccessfullDownloadsFromDownloadStore(subsSuccessfullyUpdated, 'subsToUpdate')
        })
        .then(removeAnyPostsNoLongerNeeded)
        // We want to favour getting the subs and posts first, before comments and media downloads
        .then(() => (downloadsStore.moreSubsToUpdate() ? startSomeDownloads() : Promise.resolve()))
    )
  }

  // if (downloadsStore.moreCommentsToRetrieve() && adminSettingsCache.downloadComments) {
  //   return (
  //     getCommentsForPosts(adminSettingsCache, downloadsStore.commentsToRetrieve)
  //       .then((postIdsOfCommentsRetreived: string[]) => {
  // removeSuccessfullDownloadsFromDownloadStore(postIdsOfCommentsRetreived, 'commentsToRetrieve')
  //       })
  //       // We want to favour getting more subs and posts first, before media downloads
  //       .then(() => (downloadsStore.moreSubsToUpdate() ? startSomeDownloads() : Promise.resolve()))
  //   )
  // }

  // if (downloadsStore.morePostsMediaToBeDownloaded()) {
  //   return dfgf(adminSettingsCache, downloadsStore.postsMediaToBeDownloaded)
  // .then(mediaDownloads => removeSuccessfullDownloadsFromDownloadStore(mediaDownloads, 'postsMediaToBeDownloaded'))
  // }

  // Also on download complete, we update these things:
  //   - mediaDownloadTries for a post needs to be updated in posts table regardless of success - we do  first before download starts
  //   - On successful update, set media_has_been_downloaded to true in posts table
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
