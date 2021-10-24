import { FastifyReply, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'

import { db } from '../../../db/db'
import { PostWithComments } from '../../../db/entities/Posts/Post'
import { findAnyMediaFilesForPosts, PostWithDownloadedFiles } from './find-posts-media-files'
import { genPrettyDateCreatedAgoFromUTC } from './pretty-date-created-ago'

type PostWithDownloadedFilesAndCommentsAndPrettyDate = PostWithDownloadedFilesAndComments & {
  prettyDateCreated: string
  prettyDateCreatedAgo: string
}

type ReplyLocals = {
  post: PostWithDownloadedFilesAndCommentsAndPrettyDate
  pageTitle: string
}

type FastifyReplyWithLocals = {
  locals: ReplyLocals
} & FastifyReply

type Params = {
  postId: string
}

type PostWithDownloadedFilesAndComments = PostWithComments & PostWithDownloadedFiles

async function generatePost(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const replyWithLocals = reply as FastifyReplyWithLocals
  const params = request.params as Params
  const { postId } = params

  await db
    .getSinglePostData(postId)
    .then(post => findAnyMediaFilesForPosts([post]).then(posts => posts[0] as PostWithDownloadedFilesAndComments))
    .then((post: PostWithDownloadedFilesAndComments) => {
      replyWithLocals.locals.post = {
        ...post,
        /*****
          created_utc is a unix timestamp, which is in seconds, not milliseconds.
          We need to use { zone: 'Etc/UTC' } as that is where created_utc is set.
        *****/
        prettyDateCreated: DateTime.fromSeconds(post.created_utc, { zone: 'Etc/UTC' }).toFormat(
          'yyyy LLL dd, h:mm a'
        ),
        prettyDateCreatedAgo: genPrettyDateCreatedAgoFromUTC(post.created_utc),
      }
      replyWithLocals.locals.pageTitle = post.title
    })
}

export { generatePost }
