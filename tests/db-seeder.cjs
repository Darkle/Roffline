// Note: this file is commonjs as it is used in TasksFile.ts. Couldnt get it to load as typescript file.
const { setTimeout } = require('timers/promises')

const sqlite3 = require('sqlite3')
const lmdb = require('lmdb')
const { Packr } = require('msgpackr')
const { DateTime } = require('luxon')

// TODO:
// Theres a thing in geany to do first.
// Populate testing-posts-media folder with subfolders of each post with media
//    Perhaps instead of copying the data from seed (eg images/videos), i could just do symlinks
//    For the image posts, have some that have more than one image
// Check for anything else to do in DB/Media Seeding section in evernote

let db = null
let commentsDB = null

const createTestUser = username =>
  db.run(
    'INSERT INTO users (name,subreddits,hideStickiedPosts,onlyShowTitlesInFeed,infiniteScroll,darkModeTheme) VALUES (?,?,?,?,?,?);',
    [username, '[]', 1, 0, 0, 0]
  )

const createTestSubs = () => {
  db.serialize(function () {
    db.run(
      `CREATE TABLE subreddit_table_aww (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);`
    )
    db.run(`INSERT INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('aww', ${Date.now()});    `)
    db.run(
      `CREATE TABLE subreddit_table_askreddit (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);`
    )
    db.run(`INSERT INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('askreddit', ${Date.now()});`)
    db.run(`UPDATE users SET subreddits=json('["aww", "askreddit"]') WHERE name = 'shine-9000-shack-today-6';`)
  })
}

const now = DateTime.now()

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

function generatePosts() {
  const seedPostsData = Array.from({ length: 100 }, (v, i) => i).flatMap(index => {
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

      postData.subreddit = sub
      postData.id = `${atoz[index]}${index}${atoz[index2]}${index2}`
      if (index < 2) {
        postData.created_utc = Number(now.toSeconds().toFixed())
      }
      if (index > 2 && index < 10) {
        postData.created_utc = Number(now.minus({ hours: index2 }).toSeconds().toFixed())
      }
      if (index > 10 && index < 20) {
        postData.created_utc = Number(now.minus({ days: index2 }).toSeconds().toFixed())
      }
      if (index > 20 && index < 40) {
        postData.created_utc = Number(now.minus({ months: index2 }).toSeconds().toFixed())
      }
      if (index > 40 && index < 60) {
        postData.created_utc = Number(
          now
            .minus({ months: index2 + 12 })
            .toSeconds()
            .toFixed()
        )
      }
      if (index > 60) {
        postData.created_utc = Number(now.toSeconds().toFixed())
      }
      postData.score = index * index2
      postData.media_has_been_downloaded = false
      postData.mediaDownloadTries = 0
      // set a couple to have commentsDownloaded false
      postData.commentsDownloaded = index !== 0 && index % 10 === 0 ? false : true
      postData.post_hint = postData.post_hint ? postData.post_hint : null
      postData.crosspost_parent = postData.crosspost_parent ? postData.crosspost_parent : null

      return convertBooleanValsToIntegers(postData)
    })
  })

  db.serialize(function () {
    db.parallelize(function () {
      seedPostsData.forEach(pData => {
        /**
         * @type {PostData}
         */
        // @ts-expect-error
        const postData = pData

        db.run(
          'INSERT INTO posts (id,subreddit,author,title,selftext,selftext_html,score,is_self,stickied,created_utc,domain,is_video,media,media_has_been_downloaded,mediaDownloadTries,post_hint,permalink,url,crosspost_parent,commentsDownloaded) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?,?,?,?,?);'.repeat(
            7
          ),
          [
            postData.id,
            postData.subreddit,
            postData.author,
            postData.title,
            postData.selftext,
            postData.selftext_html,
            postData.score,
            postData.is_self,
            postData.stickied,
            postData.created_utc,
            postData.domain,
            postData.is_video,
            postData.media_has_been_downloaded,
            postData.mediaDownloadTries,
            postData.post_hint,
            postData.permalink,
            postData.url,
            postData.crosspost_parent,
            postData.commentsDownloaded,
          ]
        )
      })
    })

    db.run(
      `UPDATE posts SET media=json('${JSON.stringify(
        videoPostData.media
      )}') WHERE permalink = '/r/videos/comments/mldjlx/a_17_year_old_biggie_smalls_killing_it_in_a/';`
    )
  })
}

const commentsSeed = require('./seed-data/comments.json')

const getRandomComment = () => commentsSeed[Math.round(0 + Math.random() * (commentsSeed.length - 1))]

const msgpackPacker = new Packr()

function generateComments() {
  db.all(`SELECT id from posts where commentsDownloaded = true`, (err, results) => {
    if (err) {
      console.error(err)
      throw err
    }
    const postIdsInDB = results.map(({ id }) => id)

    commentsDB.transaction(() => {
      postIdsInDB.forEach((id, index) => {
        // have empty comments every once in a while
        const comments = index % 30 === 0 ? [] : getRandomComment()

        commentsDB.put(id, msgpackPacker.pack(comments))
      })
    })
  })
}

function generateSubFeedData() {
  db.all(`SELECT id from posts where commentsDownloaded = true`, (err, results) => {
    if (err) {
      console.error(err)
      throw err
    }

    const postIdsInDB = results.map(({ id }) => id)

    const getRandomPostId = () => postIdsInDB[Math.round(0 + Math.random() * (postIdsInDB.length - 1))]

    const genFeedRowData = () =>
      Array.from({ length: 200 }, (v, i) => i).map(index => {
        if (index < 51) {
          return [
            getRandomPostId(),
            getRandomPostId(),
            getRandomPostId(),
            getRandomPostId(),
            getRandomPostId(),
            getRandomPostId(),
          ]
        }
        if (index > 50 && index < 101) {
          return [getRandomPostId(), getRandomPostId(), getRandomPostId(), getRandomPostId(), getRandomPostId()]
        }
        if (index > 100 && index < 121) {
          return [getRandomPostId(), getRandomPostId(), getRandomPostId(), getRandomPostId()]
        }
        if (index > 120 && index < 161) {
          return [getRandomPostId(), getRandomPostId(), getRandomPostId()]
        }
        if (index > 160) {
          return [getRandomPostId(), getRandomPostId()]
        }
      })

    const feedDataAwwSub = genFeedRowData()
    const feedDataAskRedditSub = genFeedRowData()

    // If parellalize they go out of order
    db.serialize(function () {
      feedDataAwwSub.forEach((rowData, index) => {
        if (index < 51) {
          db.run(
            `INSERT INTO subreddit_table_askreddit (posts_Default,topPosts_Day,topPosts_Week,topPosts_Month,topPosts_Year,topPosts_All) VALUES(?,?,?,?,?,?)`,
            rowData
          )
        }
        if (index > 50 && index < 101) {
          db.run(
            `INSERT INTO subreddit_table_askreddit (posts_Default,topPosts_Week,topPosts_Month,topPosts_Year,topPosts_All) VALUES(?,?,?,?,?)`,
            rowData
          )
        }
        if (index > 100 && index < 121) {
          db.run(
            `INSERT INTO subreddit_table_askreddit (posts_Default,topPosts_Month,topPosts_Year,topPosts_All) VALUES(?,?,?,?)`,
            rowData
          )
        }
        if (index > 120 && index < 161) {
          db.run(
            `INSERT INTO subreddit_table_askreddit (posts_Default,topPosts_Year,topPosts_All) VALUES(?,?,?)`,
            rowData
          )
        }
        if (index > 160) {
          db.run(`INSERT INTO subreddit_table_askreddit (posts_Default,topPosts_All) VALUES(?,?)`, rowData)
        }
      })
      feedDataAskRedditSub.forEach((rowData, index) => {
        if (index < 51) {
          db.run(
            `INSERT INTO subreddit_table_aww (posts_Default,topPosts_Day,topPosts_Week,topPosts_Month,topPosts_Year,topPosts_All) VALUES(?,?,?,?,?,?)`,
            rowData
          )
        }
        if (index > 50 && index < 101) {
          db.run(
            `INSERT INTO subreddit_table_aww (posts_Default,topPosts_Week,topPosts_Month,topPosts_Year,topPosts_All) VALUES(?,?,?,?,?)`,
            rowData
          )
        }
        if (index > 100 && index < 121) {
          db.run(
            `INSERT INTO subreddit_table_aww (posts_Default,topPosts_Month,topPosts_Year,topPosts_All) VALUES(?,?,?,?)`,
            rowData
          )
        }
        if (index > 120 && index < 161) {
          db.run(
            `INSERT INTO subreddit_table_aww (posts_Default,topPosts_Year,topPosts_All) VALUES(?,?,?)`,
            rowData
          )
        }
        if (index > 160) {
          db.run(`INSERT INTO subreddit_table_aww (posts_Default,topPosts_All) VALUES(?,?)`, rowData)
        }
      })
    })
  })
}

async function seedDB(testingEnvVars) {
  console.log('Seeding DB with data')

  // Need to wait for the server to be ready
  await setTimeout(2000)

  if (!db) {
    db = new sqlite3.Database(testingEnvVars.SQLITE_DBPATH)
  }

  if (!commentsDB) {
    commentsDB = lmdb.open({ path: testingEnvVars.COMMENTS_DBPATH, encoding: 'binary' })
  }

  console.log('Creating test user')
  createTestUser(testingEnvVars.TESTING_DEFAULT_USER)

  console.log('Creating test subs')
  createTestSubs()

  console.log('Generating and seeding posts in db')
  generatePosts()
  console.log('Finished generating and seeding posts in db')

  console.log('Generating comments in db')
  generateComments()
  console.log('Finished generating commentsin db')

  console.log('Generating feed data in db')
  generateSubFeedData()
  console.log('Finished generating feed data in db')
}

module.exports = {
  seedDB,
}
