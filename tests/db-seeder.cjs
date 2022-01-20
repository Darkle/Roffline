/*****
  Notes: 
  * This file is commonjs as it is used in TasksFile.ts. Couldnt get it to load as typescript file.
  * We want most of this to be deterministic and not totally random as the visual tests
  will need posts in the same place and have the same data.
*****/
const { setTimeout } = require('timers/promises')
const fs = require('fs')
const path = require('path')

const sqlite3 = require('sqlite3')
const lmdb = require('lmdb')
const { Packr } = require('msgpackr')
const { DateTime } = require('luxon')

const articleLinkPostData = require('./seed-data/article-link-only-post.json')
const imagePostData = require('./seed-data/image-post.json')
const selfQuestionPostData = require('./seed-data/self-post-question-in-title-no-text-no-link.json')
const textPostLinkPostData = require('./seed-data/text-post-link-in-text.json')
const textPostNoLinkPostData = require('./seed-data/text-post-no-link.json')
const videoPostData = require('./seed-data/video-post.json')
const crossPostData = require('./seed-data/cross-post.json')
const commentsSeed = require('./seed-data/comments.json')

let db = null
let commentsDB = null
const atoz = 'abcdefghijklmnopqrstuvwqyz'.repeat(99)
// We need to use { zone: 'Etc/UTC' } as that is where created_utc is set.
const now = DateTime.fromMillis(Date.now(), { zone: 'Etc/UTC' })
const msgpackPacker = new Packr()
let comments = commentsSeed

// make more comments
Array.from({ length: 7 }).forEach(() => {
  comments = [...comments, ...comments]
})

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
  const seedPostsData = Array.from({ length: 100 }, (v, i) => i).flatMap(outerIndex => {
    return [
      articleLinkPostData,
      imagePostData,
      selfQuestionPostData,
      textPostLinkPostData,
      textPostNoLinkPostData,
      videoPostData,
      crossPostData,
    ].map((pData, innerIndex) => {
      /**
       * @type {PostData}
       */
      // @ts-expect-error
      const postData = pData

      const sub = outerIndex % 2 === 0 ? 'aww' : 'askreddit'

      postData.subreddit = sub
      postData.id = `${atoz[outerIndex]}${outerIndex}${atoz[innerIndex]}${innerIndex}`

      if (outerIndex < 1) {
        postData.created_utc = Number(
          now
            .minus({ seconds: outerIndex + innerIndex })
            .toSeconds()
            .toFixed()
        )
      }
      if (outerIndex > 0 && outerIndex < 10) {
        postData.created_utc = Number(
          now
            .minus({ hours: outerIndex + innerIndex })
            .toSeconds()
            .toFixed()
        )
      }
      if (outerIndex > 10 && outerIndex < 20) {
        postData.created_utc = Number(
          now
            .minus({ days: outerIndex + innerIndex })
            .toSeconds()
            .toFixed()
        )
      }
      if (outerIndex > 20 && outerIndex < 40) {
        postData.created_utc = Number(
          now
            .minus({ days: outerIndex + innerIndex })
            .toSeconds()
            .toFixed()
        )
      }
      if (outerIndex > 40 && outerIndex < 60) {
        postData.created_utc = Number(now.minus({ months: innerIndex, days: outerIndex }).toSeconds().toFixed())
      }
      if (outerIndex > 60) {
        postData.created_utc = Number(
          now
            .minus({ months: outerIndex + innerIndex })
            .toSeconds()
            .toFixed()
        )
      }

      postData.score = outerIndex * innerIndex
      postData.media_has_been_downloaded = true
      postData.mediaDownloadTries = 1
      // set a couple to have commentsDownloaded false
      postData.commentsDownloaded = outerIndex !== 0 && outerIndex % 10 === 0 ? false : true
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
        const com = index % 30 === 0 ? [] : comments[index].comments

        commentsDB.put(id, msgpackPacker.pack(com))
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

    const genFeedRowData = () =>
      Array.from({ length: 200 }, (v, i) => i).map(index => {
        if (index < 51) {
          return [
            postIdsInDB[index],
            postIdsInDB[index + 1],
            postIdsInDB[index + 2],
            postIdsInDB[index + 3],
            postIdsInDB[index + 4],
            postIdsInDB[index + 5],
          ]
        }
        if (index > 50 && index < 101) {
          return [
            postIdsInDB[index],
            postIdsInDB[index + 1],
            postIdsInDB[index + 2],
            postIdsInDB[index + 3],
            postIdsInDB[index + 4],
          ]
        }
        if (index > 100 && index < 121) {
          return [postIdsInDB[index], postIdsInDB[index + 1], postIdsInDB[index + 2], postIdsInDB[index + 3]]
        }
        if (index > 120 && index < 161) {
          return [postIdsInDB[index], postIdsInDB[index + 1], postIdsInDB[index + 2]]
        }
        if (index > 160) {
          return [postIdsInDB[index], postIdsInDB[index + 1]]
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

function populateMediaFolders(mediaRootFolder) {
  db.all(`SELECT * from posts`, (err, posts) => {
    if (err) {
      console.error(err)
      throw err
    }

    posts.forEach((post, index) => {
      fs.mkdirSync(path.join(mediaRootFolder, post.id))

      // video post
      if (post.url === 'https://www.youtube.com/watch?v=l8oDTv_rrbI') {
        fs.symlinkSync(
          path.join(process.cwd(), 'tests', 'seed-data', 'media', 'video1.mp4'),
          path.join(mediaRootFolder, post.id, 'video1.mp4')
        )
      }
      // image post
      if (post.url === 'https://i.redd.it/131n79wzm2c81.jpg') {
        // want some image posts to show gallery
        if (index % 2 === 0) {
          fs.symlinkSync(
            path.join(process.cwd(), 'tests', 'seed-data', 'media', '237-536x354.jpg'),
            path.join(mediaRootFolder, post.id, '237-536x354.jpg')
          )
          fs.symlinkSync(
            path.join(process.cwd(), 'tests', 'seed-data', 'media', '719-200x300.jpg'),
            path.join(mediaRootFolder, post.id, '719-200x300.jpg')
          )
          fs.symlinkSync(
            path.join(process.cwd(), 'tests', 'seed-data', 'media', '1084-536x354-grayscale.jpg'),
            path.join(mediaRootFolder, post.id, '1084-536x354-grayscale.jpg')
          )
        } else {
          fs.symlinkSync(
            path.join(process.cwd(), 'tests', 'seed-data', 'media', 'cat1.jpg'),
            path.join(mediaRootFolder, post.id, 'cat1.jpg')
          )
        }
      }
      // article link post
      if (
        post.url ===
        'https://www.theguardian.com/technology/2022/jan/16/panic-as-kosovo-pulls-the-plug-on-its-energy-guzzling-bitcoin-miners'
      ) {
        fs.symlinkSync(
          path.join(
            process.cwd(),
            'tests',
            'seed-data',
            'media',
            'Panic as Kosovo pulls the plug on its energy-guzzling bitcoin miners _ Cryptocurrencies _ The Guardian.pdf'
          ),
          path.join(mediaRootFolder, post.id, 'article.pdf')
        )
      }
      // article link in text post
      if (
        post.url ===
        'https://www.reddit.com/r/functionalprogramming/comments/rzmtfo/fuml_functional_data_serialization_language/'
      ) {
        fs.symlinkSync(
          path.join(
            process.cwd(),
            'tests',
            'seed-data',
            'media',
            'sumeetdas_fuml_ Functional Minimal Language.pdf'
          ),
          path.join(mediaRootFolder, post.id, 'article.pdf')
        )
      }
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

  console.log('Generating post media')
  populateMediaFolders(testingEnvVars.POSTS_MEDIA_DOWNLOAD_DIR)

  // None of the db calls are promise-based, so waiting arbitrary amount till they are finished. Yes this is lazy.
  await setTimeout(8000)

  console.log('Finished generating post media')
}

module.exports = {
  seedDB,
}
