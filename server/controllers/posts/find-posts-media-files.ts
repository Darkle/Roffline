import path from 'path'
import fs from 'fs'

import * as RA from 'ramda-adjunct'
import Prray from 'prray'

import { Post } from '../../../db/entities/Posts/Post'
import { getEnvFilePath } from '../../utils'

const postsMediaFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

const getPostMediaDir = (postId: string): string => path.join(postsMediaFolder, postId)

const getListOfPostsDownloadedFiles = (postId: string): Promise<string[]> =>
  fs.promises.readdir(getPostMediaDir(postId))

type PostWithDownloadedFiles = Post & { downloadedFiles: string[] }

function findAnyMediaFilesForPosts(posts: Post[]): Promise<PostWithDownloadedFiles[]> {
  return Prray.from(posts).mapAsync(async post => {
    const folderExists = await fs.promises.stat(getPostMediaDir(post.id)).catch(RA.noop)

    return folderExists
      ? getListOfPostsDownloadedFiles(post.id).then(downloadedFiles => ({ ...post, downloadedFiles }))
      : Promise.resolve({ ...post, downloadedFiles: [] })
  })
}

export { findAnyMediaFilesForPosts, PostWithDownloadedFiles }
