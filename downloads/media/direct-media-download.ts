import type { Stats, DownloadInfoStats } from 'node-downloader-helper'
import { DownloaderHelper } from 'node-downloader-helper'
import prettyBytes from 'pretty-bytes'

import type { AdminSettings } from '../../db/entities/AdminSettings'
import type { Post } from '../../db/entities/Posts/Post'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'

type PostWithOptionalTextMetaData = Post & { isTextPostWithNoUrlsInPost?: boolean }

const gifvExtension = 'gifv'

const convertGifvLinkToMp4 = (url: string): string => `${url.slice(0, -gifvExtension.length)}mp4`

const convertAnyImgurGifvLinks = (url: string): string =>
  url.endsWith(`.${gifvExtension}`) ? convertGifvLinkToMp4(url) : url

const fileTooLarge = (fileSizeInBytes: number, videoDownloadMaxFileSize: string): boolean => {
  const oneMBInBytes = 1024
  // videoDownloadMaxFileSize is stored as a string in the db
  const vidDownMaxSizeInBytes = Number(videoDownloadMaxFileSize) * oneMBInBytes * oneMBInBytes

  return fileSizeInBytes > vidDownMaxSizeInBytes
}

// eslint-disable-next-line max-lines-per-function
function downloadDirectMediaLink(
  post: PostWithOptionalTextMetaData,
  adminSettings: AdminSettings,
  postMediaFolder: string
): Promise<void> {
  const url = convertAnyImgurGifvLinks(post.url)

  // eslint-disable-next-line max-lines-per-function
  return new Promise((resolve, reject) => {
    const download = new DownloaderHelper(url, postMediaFolder)

    download.on('error', reject)

    download.on('timeout', () => reject(new Error(`Timeout downloading direct media for post: ${post.id}`)))

    // 'download' event fires once and signifies the download starting
    download.on('download', (downloadInfo: DownloadInfoStats): void => {
      const fileSizeInBytes = downloadInfo?.totalSize ?? 0

      // eslint-disable-next-line functional/no-conditional-statement
      if (fileTooLarge(fileSizeInBytes, adminSettings.videoDownloadMaxFileSize)) {
        reject(
          new Error(
            `Direct download errror: File too large: ${prettyBytes(
              fileSizeInBytes
            )}. videoDownloadMaxFileSize is set to ${adminSettings.videoDownloadMaxFileSize}MB`
          )
        )
      }
    })

    download.on('progress.throttled', (stats: Stats): void => {
      adminMediaDownloadsViewerOrganiser.setDownloadProgress(post.id, stats.downloaded, stats.total, stats.speed)
    })

    download.on('end', () => resolve())

    download.start().catch(reject)
  })
}

export { downloadDirectMediaLink }
