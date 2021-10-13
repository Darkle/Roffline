import path from 'path'
import fs from 'fs'

import RA from 'ramda-adjunct'
import Prray from 'prray'

import { Post } from '../../../db/entities/Posts'

const postsMediaDir = path.join(process.cwd(), 'posts-media')

const getPostMediaDir = (postId: string): string => path.join(postsMediaDir, postId)

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
