// Note: this file is commonjs as it is used in TasksFile.ts
const { setTimeout } = require('timers/promises')

const execa = require('execa')
const SqlString = require('sqlstring-sqlite')
const Prray = require('prray').default

// TODO:
// I also need to add the generated posts to the each subs table (ie the feeds data)
// Populate comments db with comments.
// For the image posts, have some that have more than one image
// So will also need some posts to have empty comments, some to have some comments, and some to have null for comments so we can say still getting comments.
// Populate testing-posts-media folder with subfolders of each post with media
//  Perhaps instead of copying the data from seed (eg images/videos), i could just do symlinks
// Check for anything else to do in DB/Media Seeding section in evernote

let sqliteDBPath = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RUNDB = (sql, params) =>
  execa
    .command(
      'sqlite3 -batch' +
        " '" +
        sqliteDBPath +
        "' " +
        '"' +
        (params
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            SqlString.format(sql, params)
          : sql) +
        '"',
      {
        cleanup: true,
        shell: true,
      }
    )
    .catch(err => {
      console.error(err)
      process.exit(1)
    })

const createTestUser = async username => {
  await RUNDB(
    'INSERT OR IGNORE INTO users (name,subreddits,hideStickiedPosts,onlyShowTitlesInFeed,infiniteScroll,darkModeTheme) VALUES (?,?,?,?,?,?);',
    [username, '[]', 1, 0, 0, 0]
  )
}

const createTestSubs = async () => {
  await RUNDB(
    `
CREATE TABLE IF NOT EXISTS subreddit_table_aww (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);
INSERT OR IGNORE INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('aww', 1642383761179);
CREATE TABLE IF NOT EXISTS subreddit_table_askreddit (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);
INSERT OR IGNORE INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('askreddit', 1642383761179);
UPDATE users SET subreddits='"[\\"aww\\",\\"askreddit\\"]"' WHERE name = 'shine-9000-shack-today-6';    
    `
  )
}

let created_utc_starter = Date.now()

const articleLinkPostData = require('./seed-data/article-link-only-post.json')
const imagePostData = require('./seed-data/image-post.json')
const selfQuestionPostData = require('./seed-data/self-post-question-in-title-no-text-no-link.json')
const textPostLinkPostData = require('./seed-data/text-post-link-in-text.json')
const textPostNoLinkPostData = require('./seed-data/text-post-no-link.json')
const videoPostData = require('./seed-data/video-post.json')
const crossPostData = require('./seed-data/cross-post.json')

/*****
  We want most of this to be deterministic and not totally random as the visual tests
  will need posts in the same place and have the same data.
*****/

const atoz = 'abcdefghijklmnopqrstuvwqyz'.repeat(99)

function convertBooleanValsToIntegers(postData) {
  return Object.entries(postData).reduce((acc, [key, val]) => {
    if (val === true) {
      val = 1
    }
    if (val === false) {
      val = 0
    }
    return { ...acc, [key]: val }
  }, {})
}

/** @typedef {object} PostData
 * @property {string} id
 * @property {string} subreddit
 * @property {string} author
 * @property {string} title
 * @property {string} selftext
 * @property {null} selftext_html
 * @property {number} score
 * @property {boolean} is_self
 * @property {boolean} media_has_been_downloaded
 * @property {boolean} stickied
 * @property {number} created_utc
 * @property {number} mediaDownloadTries
 * @property {string} domain
 * @property {boolean} is_video
 * @property {boolean} commentsDownloaded
 * @property {string|null} post_hint
 * @property {string} permalink
 * @property {string|null} crosspost_parent
 * @property {string} url
 * @property {object|null} media
 * @property {object} media.oembed
 * @property {string} media.oembed.provider_url
 * @property {string} media.oembed.title
 * @property {string} media.oembed.html
 * @property {number} media.oembed.thumbnail_width
 * @property {number} media.oembed.height
 * @property {number} media.oembed.width
 * @property {string} media.oembed.version
 * @property {string} media.oembed.author_name
 * @property {string} media.oembed.provider_name
 * @property {string} media.oembed.thumbnail_url
 * @property {string} media.oembed.type
 * @property {number} media.oembed.thumbnail_height
 * @property {string} media.oembed.author_url
 * @property {string} media.type
 */

async function generatePosts() {
  const seedPostsData = Array.from({ length: 100 }, (v, i) => i).map(index => {
    return [
      articleLinkPostData,
      imagePostData,
      selfQuestionPostData,
      textPostLinkPostData,
      textPostNoLinkPostData,
      videoPostData,
      crossPostData,
    ].map((pData, index2) => {
      /**
       * @type {PostData}
       */
      // @ts-expect-error
      const postData = pData

      const sub = index % 2 === 0 ? 'aww' : 'askreddit'
      created_utc_starter = created_utc_starter + 1
      postData.subreddit = sub
      postData.id = `${atoz[index]}${index}${atoz[index2]}${index2}`
      postData.created_utc = created_utc_starter
      postData.score = index * index2
      postData.media_has_been_downloaded = false
      postData.mediaDownloadTries = 0
      postData.commentsDownloaded = false
      postData.media =
        typeof postData.media === 'object'
          ? JSON.stringify(postData.media)
          : typeof postData.media === 'string'
          ? postData.media
          : null
      postData.post_hint = postData.post_hint ? postData.post_hint : null
      postData.crosspost_parent = postData.crosspost_parent ? postData.crosspost_parent : null

      return convertBooleanValsToIntegers(postData)
    })
  })

  // await RUNDB(
  //   'INSERT INTO posts (id,subreddit,author,title,selftext,selftext_html,score,is_self,stickied,created_utc,domain,is_video,media_has_been_downloaded,mediaDownloadTries,post_hint,permalink,url,crosspost_parent,commentsDownloaded, media) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);',
  //   [
  //     // @ts-expect-error
  //     seedPostsData[0][0].id,
  //     // @ts-expect-error
  //     seedPostsData[0][0].subreddit,
  //     // @ts-expect-error
  //     seedPostsData[0][0].author,
  //     // @ts-expect-error
  //     seedPostsData[0][0].title,
  //     // @ts-expect-error
  //     seedPostsData[0][0].selftext,
  //     // @ts-expect-error
  //     seedPostsData[0][0].selftext_html,
  //     // @ts-expect-error
  //     seedPostsData[0][0].score,
  //     // @ts-expect-error
  //     seedPostsData[0][0].is_self,
  //     // @ts-expect-error
  //     seedPostsData[0][0].stickied,
  //     // @ts-expect-error
  //     seedPostsData[0][0].created_utc,
  //     // @ts-expect-error
  //     seedPostsData[0][0].domain,
  //     // @ts-expect-error
  //     seedPostsData[0][0].is_video,
  //     // @ts-expect-error
  //     seedPostsData[0][0].media_has_been_downloaded,
  //     // @ts-expect-error
  //     seedPostsData[0][0].mediaDownloadTries,
  //     // @ts-expect-error
  //     seedPostsData[0][0].post_hint,
  //     // @ts-expect-error
  //     seedPostsData[0][0].permalink,
  //     // @ts-expect-error
  //     seedPostsData[0][0].url,
  //     // @ts-expect-error
  //     seedPostsData[0][0].crosspost_parent,
  //     // @ts-expect-error
  //     seedPostsData[0][0].commentsDownloaded,
  //     null,
  //   ]
  // )

  // await RUNDB(
  //   `
  // UPDATE posts SET media=json('${JSON.stringify(videoPostData.media)
  //   .replaceAll('(', '\\(')
  //   .replaceAll(')', '\\)')
  //   .replaceAll('&', '\\&')}');
  // `
  // )
  console.log(JSON.stringify(videoPostData.media))
  // await RUNDB(
  //   `
  // UPDATE posts SET media='{"oembed":{"provider_url":"https://www.youtube.com/","title":"Volcanic Eruption May Be Biggest Ever Seen From Space","html":"&lt;iframe width=\"356\" height=\"200\" src=\"https://www.youtube.com/embed/zoMRwyNhqJ4?feature=oembed&amp;enablejsapi=1\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen&gt;&lt;/iframe&gt;","thumbnail_width":480,"height":200,"width":356,"version":"1.0","author_name":"Scott Manley","provider_name":"YouTube","thumbnail_url":"https://i.ytimg.com/vi/zoMRwyNhqJ4/hqdefault.jpg","type":"video","thumbnail_height":360,"author_url":"https://www.youtube.com/c/szyzyg"},"type":"youtube.com"}';
  // `
  // )

  // return Prray.from(seedPostsData).forEachAsync(
  //   postsDataChunkArr =>
  //     RUNDB(
  //       'INSERT INTO posts (id,subreddit,author,title,selftext,selftext_html,score,is_self,stickied,created_utc,domain,is_video,media_has_been_downloaded,mediaDownloadTries,post_hint,permalink,url,crosspost_parent,commentsDownloaded) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);'.repeat(
  //         7
  //       ),
  //       postsDataChunkArr.flatMap(pData => {
  //         /**
  //          * @type {PostData}
  //          */
  //         // @ts-expect-error
  //         const postData = pData

  //         return [
  //           postData.id,
  //           postData.subreddit,
  //           postData.author,
  //           postData.title,
  //           postData.selftext,
  //           postData.selftext_html,
  //           postData.score,
  //           postData.is_self,
  //           postData.stickied,
  //           postData.created_utc,
  //           postData.domain,
  //           postData.is_video,
  //           postData.media_has_been_downloaded,
  //           postData.mediaDownloadTries,
  //           postData.post_hint,
  //           postData.permalink,
  //           postData.url,
  //           postData.crosspost_parent,
  //           postData.commentsDownloaded,
  //           postData.id,
  //           postData.media,
  //         ]
  //       })
  //     ),
  //   { concurrency: 1 }
  // )
}

async function seedDB(testingEnvVars) {
  await setTimeout(2500)
  sqliteDBPath = testingEnvVars.SQLITE_DBPATH
  console.log('Seeding DB with data')

  console.log('Creating test user')
  await createTestUser(testingEnvVars.TESTING_DEFAULT_USER)

  console.log('Creating test subs')
  await createTestSubs()

  console.log('Generating and seeding posts in db')
  await generatePosts()
  console.log('Finished generating and seeding posts in db')

  //TODO: make sure to set the sub of each post to be either 'aww' or 'askreddit'
}

module.exports = {
  seedDB,
}
