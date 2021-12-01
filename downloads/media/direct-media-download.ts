import { DownloaderHelper, Stats } from 'node-downloader-helper'

import { Post } from '../../db/entities/Posts/Post'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'

const gifvExtension = 'gifv'

const convertGifvLinkToMp4 = (url: string): string => `${url.slice(0, -gifvExtension.length)}mp4`

const convertAnyImgurGifvLinks = (url: string): string =>
  url.endsWith(`.${gifvExtension}`) ? convertGifvLinkToMp4(url) : url

function downloadDirectMediaLink(post: Post, postMediaFolder: string): Promise<void> {
  const url = convertAnyImgurGifvLinks(post.url)

  debugger
  return new Promise((resolve, reject) => {
    const download = new DownloaderHelper(url, postMediaFolder)

    download.on('error', reject)

    download.on('timeout', () => reject(new Error(`Timeout downloading direct media for post: ${post.id}`)))

    download.on('progress.throttled', (stats: Stats): void => {
      adminMediaDownloadsViewerOrganiser.setDownloadProgress(post.id, stats.progress, stats.total)
    })

    download.on('end', () => resolve())

    download.start()
  })
}

export { downloadDirectMediaLink }
