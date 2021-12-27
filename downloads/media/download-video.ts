import * as R from 'ramda'
import { unescape } from 'html-escaper'
import { compress as compressText } from 'compress-tag'

import type { AdminSettings } from '../../db/entities/AdminSettings'
import type { Post } from '../../db/entities/Posts/Post'
import { spawnSubProcess } from './spawn-external-download-process'

type PostReadyForDownload = Post & { isTextPostWithNoUrlsInPost?: boolean }

/*****
  Some urls have html entities in them for some reason.
  May as well use decodeURIComponent too just in case.
*****/
const decodeUrl = (url: string): string => decodeURIComponent(unescape(url))

const removeTrailingPFromDownloadResolution = R.slice(0, -1)

const validVideoAudioCodecCombinationsForContainer = [
  ['webm', 'webm'],
  ['webm', 'ogg'],
  ['webm', 'opus'],
  ['mp4', 'mp4'],
  ['mp4', 'm4a'],
  ['mp4', 'mp3'],
  ['mp4', 'aac'],
  ['mp4', 'ogg'],
  ['mp4', 'opus'],
  ['ogg', 'ogg'],
  ['ogg', 'opus'],
]

const createYTDLFormats = (videoDownloadMaxFileSize: string, videoDownloadResolution: string): string =>
  validVideoAudioCodecCombinationsForContainer.reduce(
    (acc: string, [videoCodec, audioCodec]): string =>
      `${acc}(bestvideo[ext=${videoCodec as string}][height<=?${videoDownloadResolution}]+bestaudio[ext=${
        audioCodec as string
      }])[filesize<=?${videoDownloadMaxFileSize}M]/`,
    ``
  )

// eslint-disable-next-line max-lines-per-function
function downloadVideo(
  post: PostReadyForDownload,
  adminSettings: AdminSettings,
  postMediaFolder: string
): Promise<void> {
  const postUrl = decodeUrl(post.url)
  const videoDownloadResolution = removeTrailingPFromDownloadResolution(adminSettings.videoDownloadResolution)
  const downloadType = 'video'

  /*****
    `--no-playlist`: downloads only the video if its a url that contains a video and the playlist

    `--playlist-items 1`: in case the url is only a playlist url. This will make yt-dlp only download the first
    video from the playlist. Also limits any channel urls to only download a single video from the channel

    `--restrict-filenames`: Restrict filenames to only ASCII characters, and avoid "&" and spaces in filenames.

    `--progress-template`: Allows us to format the output in a way that allows us to parse the update info in
    spawn-external-download-process, which we then send along to adminMediaDownloadsViewerOrganiser.

    `%(title).150s` in the --output helps trim titles that would make file name too large: https://github.com/yt-dlp/yt-dlp/issues/1136#issuecomment-932077195

    Formats:
      We check for many format combos specifically, because if we were to just use bestvideo+bestaudio, yt-dlp could
      download say a webm video file with a m4a audio file, and since an m4a audio file is incompatible with the webm
      container, yt-dlp would merge then them into a mkv file, which is not supported in browsers.

      `filesize` needs a question mark as some sites like reddit dont seem to show the filesize in the format list.

      We need `/worstaudio+worstvideo` as well as `/worst`, as `/worst` only checks for the worst single video file, so
      if the video is split into audio and video, /worst wont catch it.

      It ends up looking like this: https://pastebin.com/DUf5C7tk
  *****/

  const videoFormats = `${createYTDLFormats(
    adminSettings.videoDownloadMaxFileSize,
    videoDownloadResolution
  )}(worstaudio+worstvideo/worst)[filesize<=?${adminSettings.videoDownloadMaxFileSize}M]`

  const command = compressText`
  yt-dlp "${postUrl}" 
  --format '${videoFormats}' 
  --output "${postMediaFolder}/%(title).150s-[%(id)s]-[%(channel)s].%(ext)s" 
  --no-playlist 
  --retries 1 
  --playlist-items 1 
  --no-cache-dir 
  --no-part 
  --abort-on-error 
  --compat-options no-youtube-unavailable-videos 
  --no-colors 
  --restrict-filenames 
  --quiet 
  --progress 
  --progress-template "download:%(progress.total_bytes)s--%(progress.downloaded_bytes)s--%(progress.speed)s"
`

  return spawnSubProcess(command, post, downloadType)
}

export { downloadVideo }
