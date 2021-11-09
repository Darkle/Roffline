import path from 'path'

import Prray from 'prray'

import { getEnvFilePath, pDeleteFolder } from '../../utils'

type PostIds = string[]

const postsMediaFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

const getPostFolderPath = (postId: string): string => path.join(postsMediaFolder, postId)

function batchRemovePostsFolder(posts: PostIds): Promise<void> {
  return Prray.from(posts).forEachAsync(postId => {
    const postFolderPath = getPostFolderPath(postId)

    return pDeleteFolder(postFolderPath)
  })
}

export { batchRemovePostsFolder }
