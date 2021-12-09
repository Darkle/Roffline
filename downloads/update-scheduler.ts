import { db } from '../db/db'
import type { AdminSettings } from '../db/entities/AdminSettings'
import type { Post } from '../db/entities/Posts/Post'
import type { SubredditsMasterList } from '../db/entities/SubredditsMasterList'
import { mainLogger } from '../logging/logging'
import { isOffline } from './check-if-offline'
import type { FeedWithData } from './feeds/generate-feeds'
import { updateSubsFeeds } from './feeds/update-subs-feeds'
import { downloadsStore, removeSuccessfullDownloadsFromDownloadStore } from './downloads-store'
import { savePosts } from './posts/save-posts'
import { removeAnyPostsNoLongerNeeded } from './posts/posts-removal'
import { getCommentsForPosts } from './comments/get-comments'
import { downloadPostsMedia } from './media/download-posts-media'

/* eslint-disable functional/no-conditional-statement,functional/no-try-statement,functional/no-let,complexity,array-bracket-newline, max-lines-per-function */

type PostId = string
type Subreddit = string

const thirtySecondsInMs = 30000
let timer: ReturnType<typeof global.setTimeout>
let downloadsAreRunning = false
let adminSettingsCache: AdminSettings

// So other modules can get the adminSettingsCache that is updated every 30 secs below.
const getAdminSettingsCache = (): AdminSettings => adminSettingsCache

function updateIsWithinAllowedTimeFrame(): boolean {
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
        We save the whole post in a Map as we need different properties from the post later on
        for checking what to download when doing media downloads.
      *****/
      downloadsStore.postsMediaToBeDownloaded.set(post.id, post)
    }
  })
}

async function startSomeDownloads(): Promise<void | FeedWithData[]> {
  if (downloadsStore.moreSubsToUpdate()) {
    await updateSubsFeeds(adminSettingsCache, downloadsStore.subsToUpdate)
      .then(savePosts)
      .then((subsSuccessfullyUpdated: Subreddit[]) => {
        removeSuccessfullDownloadsFromDownloadStore(subsSuccessfullyUpdated, 'subsToUpdate')
      })
      .then(removeAnyPostsNoLongerNeeded)

    // We want to favour getting the subs and posts first, before comments and media downloads
    return downloadsStore.moreSubsToUpdate() ? startSomeDownloads() : Promise.resolve()
  }

  if (downloadsStore.moreCommentsToRetrieve() && adminSettingsCache.downloadComments) {
    await getCommentsForPosts(adminSettingsCache, downloadsStore.commentsToRetrieve).then(
      (postIdsOfCommentsRetreived: PostId[]) => {
        removeSuccessfullDownloadsFromDownloadStore(postIdsOfCommentsRetreived, 'commentsToRetrieve')
      }
    )

    // We want to favour getting more subs and posts first, before media downloads
    return downloadsStore.moreSubsToUpdate() ? startSomeDownloads() : Promise.resolve()
  }

  if (downloadsStore.morePostsMediaToBeDownloaded()) {
    return downloadPostsMedia(adminSettingsCache, downloadsStore.postsMediaToBeDownloaded).then(
      (postIdsOfMediaDownloadedSuccessfully: PostId[]) => {
        removeSuccessfullDownloadsFromDownloadStore(
          postIdsOfMediaDownloadedSuccessfully,
          'postsMediaToBeDownloaded'
        )
      }
    )
  }

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

        if (weAreOffline || !updateIsWithinAllowedTimeFrame()) return

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

export { scheduleUpdates, getAdminSettingsCache }
