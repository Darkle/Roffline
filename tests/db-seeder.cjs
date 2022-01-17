// Note: this file is commonjs as it is used in TasksFile.ts
const execa = require('execa')
const SqlString = require('sqlstring')

// TODO:
// So i could just take those 4 or 5 post types that i got from reddit and change the score, created_utc et.al. - loop over an empty array of say 100 and grab one of each post in each loop and change the data for each.
// Create user - set it to the one set in the .testing.env file.
// Populate db with posts
// Populate comments db with comments.
// So would need some posts to have more than one image, and i would need to set those posts to be an image post
//    so i guess we also need post data of the 5 (or more) different post types.
// So will also need some posts to have empty comments, some to have some comments, and some to have null for comments so we can say still getting comments.
// Populate testing-posts-media folder with subfolders of each post with media
//  Perhaps instead of copying the data from seed (eg images/videos), i could just do symlinks
//So could set the id for each post as aaaa1 and so on as need reproducability
// For the image posts, have some that have more than one image
// Check for anything else to do in DB/Media Seeding section in evernote

const testingDefaultUser = process.env['TESTING_DEFAULT_USER']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RUNDB = (sql, params) =>
  execa.command(
    'sqlite3 -batch' +
      " '" +
      process.env['SQLITE_DBPATH'] +
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

const createTestUser = async () => {
  await RUNDB(
    'INSERT OR IGNORE INTO users (name,subreddits,hideStickiedPosts,onlyShowTitlesInFeed,infiniteScroll,darkModeTheme) VALUES (?,?,?,?,?,?);',
    [testingDefaultUser, '[]', 1, 0, 0, 0]
  )
}

const createTestSubs = async () => {
  await RUNDB(
    `
CREATE TABLE IF NOT EXISTS subreddit_table_aww (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);
INSERT OR IGNORE INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('aww', 1642383761179);
CREATE TABLE IF NOT EXISTS subreddit_table_askreddit (id INTEGER PRIMARY KEY AUTOINCREMENT, posts_Default TEXT DEFAULT NULL, topPosts_Day TEXT DEFAULT NULL, topPosts_Week TEXT DEFAULT NULL, topPosts_Month TEXT DEFAULT NULL, topPosts_Year TEXT DEFAULT NULL, topPosts_All TEXT DEFAULT NULL);
INSERT OR IGNORE INTO subreddits_master_list (subreddit,lastUpdate) VALUES ('askreddit', 1642383761179);
UPDATE users SET subreddits='["aww","askreddit"]' WHERE name = 'shine-9000-shack-today-6';    
    `
  )
}

async function seedDB() {
  console.log('Seeding DB with data')

  await createTestUser()

  await createTestSubs()
}

module.exports = {
  seedDB,
}
