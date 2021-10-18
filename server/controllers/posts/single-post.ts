import { FastifyReply, FastifyRequest } from 'fastify'
// import * as R from 'ramda'
// import { compose } from 'ts-functional-pipe'

import { db } from '../../../db/db'
// import { StructuredComments } from '../../../db/entities/Comments'
import { PostWithComments } from '../../../db/entities/Posts/Post'
// import { createCommentsHtml } from '../comments'
import { findAnyMediaFilesForPosts, PostWithDownloadedFiles } from './find-posts-media-files'

type PostReadyToRender = {
  comments: string
} & PostWithDownloadedFiles

type ReplyLocals = {
  post: PostReadyToRender
  pageTitle: string
}

type FastifyReplyWithLocals = {
  locals: ReplyLocals
} & FastifyReply

type Params = {
  postId: string
}

type PostWithDownloadedFilesAndComments = PostWithComments & PostWithDownloadedFiles

// const getCommentProp = (post: PostWithDownloadedFilesAndComments): StructuredComments => post.comments

// const getCommentsDataFromPostData = compose(R.pathOr([], [1, 'data', 'children']), getCommentProp)

async function generatePost(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const replyWithLocals = reply as FastifyReplyWithLocals
  const params = request.params as Params
  const { postId } = params

  await db
    .getSinglePostData(postId)
    .then(post => findAnyMediaFilesForPosts([post]).then(posts => posts[0] as PostWithDownloadedFilesAndComments))
    .then((post: PostWithDownloadedFilesAndComments) => {
      // replyWithLocals.locals.post = {
      //   ...post,
      //   // comments: createCommentsHtml(getCommentsDataFromPostData(post)),
      //   //TODO: switch to using the frontend version of this
      //   // postContent: createPostContentHtml(post) as string,
      // }

      replyWithLocals.locals.pageTitle = post.title
    })
}

export { generatePost }
