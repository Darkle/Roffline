import { DownloaderHelper, Stats } from 'node-downloader-helper'

import { Post } from '../../db/entities/Posts/Post'

const gifvExtension = 'gifv'

const convertGifvLinkToMp4 = (url: string): string => `${url.slice(0, -gifvExtension.length)}mp4`

const convertAnyImgurGifvLinks = (url: string): string =>
  url.endsWith(`.${gifvExtension}`) ? convertGifvLinkToMp4(url) : url

function downloadDirectMediaLink({
  post,
  postMediaFolder,
}: {
  post: Post
  postMediaFolder: string
}): Promise<void> {
  const url = convertAnyImgurGifvLinks(post.url)

  return new Promise((resolve, reject) => {
    const download = new DownloaderHelper(url, postMediaFolder)

    download.on('error', reject)

    download.on('timeout', () => reject(new Error(`Timeout downloading direct media for post: ${post.id}`)))

    download.on('progress.throttled', (stats: Stats): void => {
      // TODO: i guess we would update the post downloadProgressPercentage in postsMediaToBeDownloadedCache here
      // TODO: also update the total filesize
      // addDataToDownloadProgressHistory(post, downloadUpdateMessage)
    })

    download.on('end', () => resolve())

    download.start()
  })
}

export { downloadDirectMediaLink }
