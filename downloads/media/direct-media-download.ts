import type { Stats } from 'node-downloader-helper'
import { DownloaderHelper } from 'node-downloader-helper'

import type { Post } from '../../db/entities/Posts/Post'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'

type PostWithOptionalTextMetaData = Post & { isTextPostWithNoUrlsInPost?: boolean }

const gifvExtension = 'gifv'

const convertGifvLinkToMp4 = (url: string): string => `${url.slice(0, -gifvExtension.length)}mp4`

const convertAnyImgurGifvLinks = (url: string): string =>
  url.endsWith(`.${gifvExtension}`) ? convertGifvLinkToMp4(url) : url

function downloadDirectMediaLink(post: PostWithOptionalTextMetaData, postMediaFolder: string): Promise<void> {
  const url = convertAnyImgurGifvLinks(post.url)

  return new Promise((resolve, reject) => {
    const download = new DownloaderHelper(url, postMediaFolder)

    download.on('error', reject)

    download.on('timeout', () => reject(new Error(`Timeout downloading direct media for post: ${post.id}`)))

    download.on('progress.throttled', (stats: Stats): void => {
      //stats.progress will be a percentage like this: 0.33333333 (for %33 done)
      adminMediaDownloadsViewerOrganiser.setDownloadProgress(post.id, stats.progress, stats.total)
    })

    download.on('end', () => resolve())

    download.start().catch(reject)
  })
}

export { downloadDirectMediaLink }
