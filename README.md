> [!IMPORTANT]  
> Roffline has not been updated to work with the new reddit api limits.

<p align="center">
  <img height="256px" src="frontend/static/images/logo-default-grey.svg">
</p>

<h1 align="center">Roffline (Reddit; Offline)</h1>

Roffline is a self-hosted offline Reddit server. It allows you to browse Reddit posts (including any media in the post) while offline. It is targeted at people that have intermittent internet.

Check out my other Reddit based project: [RIDO - Reddit Image Downloader & Organizer](https://github.com/Darkle/RIDO)

#### Setting Up With Docker:

- Basic Docker:

  1. Run: `cp .example.env .env`.
     - Note: for basic docker, you must not change the following env variables in the .env file:
       - `LOGDIR, POSTS_MEDIA_DOWNLOAD_DIR, SQLITE_DBPATH, COMMENTS_DBPATH`
  2. Run: `docker build . -t roffline`
  3. Run: `docker run -p 8080:8080 --env-file ./.env -v /somewhere/rl-data:/usr/src/app/rl-data roffline:latest`

- Docker Compose:
  1. Run: `docker-compose up`

#### Setting Up Without Docker:

- Requirements:
  - NodeJS LTS
  - Python 3
  - The [gallery-dl](https://github.com/mikf/gallery-dl) python module installed and available in PATH
  - The [yt-dlp](https://github.com/yt-dlp/yt-dlp) python module installed and available in PATH
  - ffmpeg installed and available in PATH (needed for yt-dlp to merge audio and video)
  - Chromium installed and available in PATH (needed for saving articles as pdf)
- Installation:
  1. Run `git clone https://github.com/Darkle/Roffline.git`
  2. Create a `.env` file with all the env variables. You can see an example one here: [.example.env](.example.env)
  3. Run `npm install`
  4. Run `npm start`

#### Features:

- Downloads media from posts for viewing offline
  - Videos are downloaded via [yt-dlp](https://github.com/yt-dlp/yt-dlp)
  - Images are downloaded via [gallery-dl](https://github.com/mikf/gallery-dl)
  - Articles are saved as a pdf via [Playwright](https://playwright.dev/)
- Responsive website - can be accessed via mobile browser as well as desktop browser
- You can easily import your subreddits from your reddit account
- Search article titles
- Dark mode
- Optional infinite scroll
- Can specify whether to download videos and the max video resolution and file size
- Can specify to only show titles in feed page
- Can specify the times at which Roffline updates
- Can specify the max simultaneous media downloads at once
- Keyboard friendly

#### Screenshots: [screenshots](screenshots/screenshots.md)

#### Limitations:

- We dont get all the comments
- We dont update posts with edits/updates
- We dont get new comments after first fetch of post and comments

#### Security:

- Roffline is not supposed to be exposed to the internet, it is intended to be hosted locally.
- The default login for the special admin page is:
  - Username: `admin`
  - Password: `foo`
  - Note: the admin login is not for the regular login page, but rather for a special admin section (found via your settings page).

#### Misc Notes:

- The video downloads are disabled by default. You can enable them in the admin settings page.
- After you add a subreddit, getting the posts and comments takes a little while - maybe 5-10 mins depending on how many subreddits you added. The media downloading starts after the posts and comments have been downloaded.

#### Tech Stack:

- [Fastify](https://www.fastify.io/)
- [RamdaJS](https://ramdajs.com/docs/)
- [Typescript](https://www.typescriptlang.org/)
- [Vue](https://vuejs.org/)
- [LMDB](https://github.com/DoctorEvidence/lmdb-js)
- [sqlite3](https://www.npmjs.com/package/sqlite3)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [gallery-dl](https://github.com/mikf/gallery-dl)
- [Chota](https://jenil.github.io/chota/)
- [Playwright](https://playwright.dev/)
- [ts-pattern](https://github.com/gvergnaud/ts-pattern)
- [Sequelize](https://sequelize.org/)

#### Alternatives:

- https://github.com/p-ranav/saveddit
- https://github.com/aliparlakci/bulk-downloader-for-reddit
- https://github.com/MonkeyMaster64/Reddit-User-Media-Downloader-Public
- https://github.com/shadowmoose/RedditDownloader
- https://github.com/j9108c/eternity
- https://github.com/Jackhammer9/RedDownloader

#### Things could possibly add later:

- Fix the pagination at the bottom of the page so it doesnt show all pages (can be a bit too many elements atm if lots of subs)
- Add unit & integration tests
- Add some e2e tests for admin pages interaction - e.g. filtering, changing db
- Compress downloaded images with mozjpeg, optipng et.al.
  - https://web.dev/introducing-libsquoosh/
  - Convert downloaded images and gifs to avif
  - Or prehaps use https://imgproxy.net/
- Convert downloaded videos to AV-1
- HTTPS via https://caddyserver.com/ - caddy is supposed to be very easy to set up
- Add exif metadata to images and videos that adds the original reddit url this media came from so you can always find the source
  - (both gallery-dl and yt-dlp have some metadata writing capabilities built in)
- Image deduping with https://github.com/idealo/imagededup and/or hashing
- Use image classification for alt info for images/videos to help blind users
  - Serverside:
  - Clientside:
    - https://medium.com/agara-labs/image-classification-with-the-client-side-neural-network-using-tensorflow-js-8f94d3dc7c5c
    - https://medium.com/the-web-tub/face-mask-detector-with-ml5-js-b44ca95dc0cc
    - https://medium.com/the-web-tub/object-detection-with-javascript-the-easy-way-74fbe98741cf
    - https://github.com/yong-asial/ml5-object-detection
    - Do this as an option you can enable
