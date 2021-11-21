import fs from 'fs'
import path from 'path'

import Prray from 'prray'
import fetch from 'node-fetch-commonjs'

import { dbLogger } from '../logging/logging'
import { folderExists, getEnvFilePath } from '../server/utils'

/* eslint-disable @typescript-eslint/explicit-function-return-type,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,max-lines-per-function,functional/no-conditional-statement,functional/no-let,functional/immutable-data,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-magic-numbers,complexity,@typescript-eslint/no-unsafe-return,@typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars */

const dev = {
  // @ts-expect-error asd
  createUser(db, user: string) {
    return db.createUser(user)
  },
  // @ts-expect-error asd
  addSubs(db, user: string, subs: string[]) {
    return db.batchAddSubreddits(user, subs)
  },
  // @ts-expect-error asd
  addIndividualPosts(db, postsIds: string[]) {
    const urls = postsIds.map(postId => `https://api.reddit.com/api/info/?id=t3_${postId}`)

    return (
      Prray.from(urls)
        .mapAsync(item => fetch(item).then(resp => resp.json()), { concurrency: 4 })
        // .then(results => console.log(results))
        // @ts-expect-error asd
        .then(postsData => db.batchAddNewPosts(postsData.map(postData => postData.data.children[0].data)))
    )
  },
  // @ts-expect-error asd
  addPosts(db, sub: string) {
    const urls = [
      `https://www.reddit.com/r/${sub}/.json`,
      `https://www.reddit.com/r/${sub}/top/.json?t=day`,
      `https://www.reddit.com/r/${sub}/top/.json?t=week`,
      `https://www.reddit.com/r/${sub}/top/.json?t=month`,
      `https://www.reddit.com/r/${sub}/top/.json?t=year`,
      `https://www.reddit.com/r/${sub}/top/.json?t=all`,
    ]

    return Prray.from(urls)
      .mapAsync(item => fetch(item).then(resp => resp.json()))
      .then(subsPostData => {
        const finalisedSubsPostsData = subsPostData.flatMap(subPostsData =>
          // @ts-expect-error asd
          subPostsData.data.children.map(post => post.data)
        )
        // console.dir(finalisedSubsPostsData, { depth: null })
        return finalisedSubsPostsData
      })
      .then(finalisedSubsPostsData => db.batchAddNewPosts(finalisedSubsPostsData))
  },
  // @ts-expect-error asd
  addSubPostIdRefs(db, sub: string) {
    const urls = [
      `https://www.reddit.com/r/${sub}/.json`,
      `https://www.reddit.com/r/${sub}/top/.json?t=day`,
      `https://www.reddit.com/r/${sub}/top/.json?t=week`,
      `https://www.reddit.com/r/${sub}/top/.json?t=month`,
      `https://www.reddit.com/r/${sub}/top/.json?t=year`,
      `https://www.reddit.com/r/${sub}/top/.json?t=all`,
    ]

    return Prray.from(urls)
      .mapAsync(item => fetch(item).then(resp => resp.json()))
      .then(results => {
        const thing = {
          [sub]: [],
        }
        results.forEach((result, indexOuter) => {
          // @ts-expect-error asd
          result?.data?.children?.forEach((post, indexInnner) => {
            let feedCategory = null
            if (indexOuter === 0) {
              feedCategory = 'posts_Default'
            }

            if (indexOuter === 1) {
              feedCategory = 'topPosts_Day'
            }

            if (indexOuter === 2) {
              feedCategory = 'topPosts_Week'
            }

            if (indexOuter === 3) {
              feedCategory = 'topPosts_Month'
            }

            if (indexOuter === 4) {
              feedCategory = 'topPosts_Year'
            }

            if (indexOuter === 5) {
              feedCategory = 'topPosts_All'
            }

            // @ts-expect-error asd
            if (!thing[sub][indexInnner]) {
              // @ts-expect-error asd
              thing[sub][indexInnner] = {}
            }

            // @ts-expect-error asd
            thing[sub][indexInnner][feedCategory] = post.data.id
          })
        })
        return thing
      })
  },
  // @ts-expect-error asd
  addComments(db) {
    return db.getAllPostIds().then((postIds: string[]) =>
      Prray.from(postIds)
        .mapAsync(
          postId => {
            console.log(`https://www.reddit.com/comments/${postId}.json`)
            return fetch(`https://www.reddit.com/comments/${postId}.json`)
              .then(resp => resp.json())
              .then(comments => ({
                comments,
                id: postId,
              }))
          },
          { concurrency: 4 }
        )
        .then(comments => db.batchSaveComments(comments))
    )
  },
  // @ts-expect-error asd
  mockMediaForPosts(db) {
    const postsMediaFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

    const getPostMediaDir = (postId: string): string => path.join(postsMediaFolder, postId)

    return db.getAllPostIds().then((postIds: string[]) =>
      Prray.from(postIds).forEachAsync(postId => {
        const postMediaDir = getPostMediaDir(postId)

        return folderExists(postMediaDir).then(exists =>
          exists ? Promise.resolve() : fs.promises.mkdir(getPostMediaDir(postId))
        )
      })
    )
  },
  // @ts-expect-error asd
  init(db) {
    setTimeout(() => {
      console.log('!!DEV DB FUNCTIONS ARE BEING RUN!!')
      dbLogger.warn('!!DEV DB FUNCTIONS ARE BEING RUN!!')

      // dev
      //   .createUser(db, 'Merp')
      //   // .addSubPostIdRefs(db, 'abruptchaos')
      //   .then(() => dev.addSubs(db, 'Merp', ['aww', 'hackernews', 'CabinPorn']))
      //   // .then(res => res.get())
      //   // .mockMediaForPosts(db)
      //   //   .createUser(db, 'Coop')
      //   //   .then(() => dev.addSubs(db, 'Coop', ['space']))
      //   //   .then(() => dev.addPosts(db, 'space'))

      //   //   //// @ts-expect-error asd
      //   //   // .then(postData => db.batchAddNewPosts([postData.data.children[0].data]))
      //   .then(() => {
      //     console.log('finished db stuff')
      //   })
      //   .catch((err: Error) => console.error(err))
    }, 3000)
  },
}

export { dev }

/* eslint-enable @typescript-eslint/explicit-function-return-type,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,max-lines-per-function,functional/no-conditional-statement,functional/no-let,functional/immutable-data,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-magic-numbers,complexity,@typescript-eslint/no-unsafe-return,@typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars */
