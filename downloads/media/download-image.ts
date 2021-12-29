import type { Dirent } from 'fs'
import fs from 'fs'
import path from 'path'

import * as R from 'ramda'
import RA from 'ramda-adjunct'
import { unescape } from 'html-escaper'
import getFilesRecurseDir from 'node-recursive-directory'

import type { AdminSettings } from '../../db/entities/AdminSettings'
import type { Post } from '../../db/entities/Posts/Post'
import { spawnSubProcess } from './spawn-external-download-process'

type PostReadyForDownload = Post & { isTextPostWithNoUrlsInPost?: boolean }

/*****
  Some urls have html entities in them for some reason.
  May as well use decodeURIComponent too just in case.
*****/
const decodeUrl = (url: string): string => decodeURIComponent(unescape(url))

const isRedditPreviewUrl = R.startsWith('https://preview.redd.it')

async function getFirstLevelDirectories(postMediaFolder: string): Promise<Dirent[] | []> {
  const dirData = await fs.promises.readdir(postMediaFolder, { withFileTypes: true })

  return dirData.filter(dirent => dirent.isDirectory())
}

async function flattenDir(postMediaFolder: string): Promise<void> {
  const files = await getFilesRecurseDir(postMediaFolder, true)
  const dirs = await getFirstLevelDirectories(postMediaFolder)

  // eslint-disable-next-line functional/no-conditional-statement
  if (files.length) {
    await Promise.all(
      files.map(file => fs.promises.rename(file.fullpath, path.join(postMediaFolder, file.filename)))
    )
  }

  // eslint-disable-next-line functional/no-conditional-statement
  if (dirs.length) {
    await Promise.all(dirs.map(dir => fs.promises.rm(path.join(postMediaFolder, dir.name), { recursive: true })))
  }
}

function downloadImage(
  post: PostReadyForDownload,
  adminSettings: AdminSettings,
  postMediaFolder: string
): Promise<void> {
  /*****
    Reddit preview image links need to be downloaded via gallery-dl using the post permalink
  *****/
  const postUrl = isRedditPreviewUrl(post.url) ? `https://www.reddit.com${post.permalink}` : decodeUrl(post.url)
  /*****
     --range 1-15 prevents us from accidentally downloading a whole user account on instagram et.al.. However this does mean that if it is
     just a regular gallery, and that gallery has more than 15 images, we only get the first 15.
  *****/
  const command = `gallery-dl "${postUrl}" --filesize-max ${adminSettings.videoDownloadMaxFileSize}M --no-part --range 1-15 --dest ${postMediaFolder}`

  const downloadType = 'image'

  return spawnSubProcess(command, post, downloadType)
    .then(() =>
      /*****
        gallery-dl downloads into subfolders, so we want to flatten that.
      *****/
      flattenDir(postMediaFolder)
    )
    .then(RA.noop)
}

export { downloadImage }
