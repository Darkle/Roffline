<p align="center">
  <img height="256px" src="frontend/static/images/logo-default-grey.svg">
</p>

<h1 align="center">Roffline (Reddit; Offline)</h1>

Roffline is a self-hosted offline Reddit server. It allows you to browse Reddit posts (including any media in the post) while offline. It is targeted at people that have intermittent internet.

#### Setting Up With Docker:

#### Setting Up Without Docker:

- Requirements:
  - NodeJS LTS
  - Python 3
  - The [gallery-dl](https://github.com/mikf/gallery-dl) python module installed and available in PATH
  - The [yt-dlp](https://github.com/yt-dlp/yt-dlp) python module installed and available in PATH
  - ffmpeg installed and available in PATH (needed for yt-dlp to merge audio and video)
- Installation:
  1. Run `git clone https://github.com/Darkle/Roffline.git`
  2. Create a `.env` file. You can see an example one here: [.example.env](.example.env)
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

#### Screenshots: [screenshots](screenshots/screenshots.md)

#### Limitations:

- We dont get all the comments
- We dont update posts with edits/updates
- We dont get new comments after first fetch of post and comments

#### Security:

- Roffline is not supposed to be exposed to the internet, it is intended to be hosted locally.
- The default login for the admin page is:
  - Username: `admin`
  - Password: `foo`

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

#### Things could possibly add later:

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
