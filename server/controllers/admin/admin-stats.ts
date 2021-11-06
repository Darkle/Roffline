import prettyBytes from 'pretty-bytes'
import prettifyTime from 'prettify-time'
import cpuStat from 'cpu-stat'
import R from 'ramda'
import { FastifyReply, FastifyRequest } from 'fastify'

import { db } from '../../../db/db'
import { getEnvFilePath, getFolderSize } from '../../utils.js'

type DBStats = {
  subsMasterListTableNumRows: number
  postsTableNumRows: number
  usersTableNumRows: number
  totalDBsizeInBytes: number
  totalCommentsDBSizeInBytes: number
}

type UnformattedAdminStats = [number, DBStats, number, number, string, number, number]

type FormattedAdminStats = {
  cpuUsage: number
  rss: string
  dbSize: string
  commentsDBSize: string
  postsWithMediaStillToDownload: number
  postsMediaFolderSize: string
  uptime: string
  lastScheduledUpdateTime: string
  numSubs: number
  numPosts: number
  numUsers: number
}

const getCpuUsagePercentP = (): Promise<number> =>
  new Promise((resolve, reject) => {
    cpuStat.usagePercent((err, percent) => (err ? reject(err) : resolve(percent)))
  })

const postsMediaFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

const oneSecond = 60

const readableUptime = (seconds: number): string =>
  seconds < oneSecond ? `${Math.round(seconds)}s` : prettifyTime(seconds)

const formatStats = R.evolve({
  rss: prettyBytes,
  uptime: readableUptime,
  cpuUsage: Math.round,
  postsMediaFolderSize: prettyBytes,
  dbSize: prettyBytes,
  commentsDBSize: prettyBytes,
})

// eslint-disable-next-line max-lines-per-function
const processResults = (results: UnformattedAdminStats): FormattedAdminStats => {
  const [
    cpuUsage,
    {
      subsMasterListTableNumRows: numSubs,
      postsTableNumRows: numPosts,
      usersTableNumRows: numUsers,
      totalDBsizeInBytes: dbSize,
      totalCommentsDBSizeInBytes: commentsDBSize,
    },
    postsWithMediaStillToDownload,
    postsMediaFolderSize,
    lastScheduledUpdateTime,
    rss,
    uptime,
  ] = results

  return {
    ...formatStats({
      cpuUsage,
      rss,
      dbSize,
      commentsDBSize,
      postsWithMediaStillToDownload,
      postsMediaFolderSize,
      uptime,
    }),
    lastScheduledUpdateTime,
    numSubs,
    numPosts,
    numUsers,
  }
}

type StatsTemplateLocals = {
  stats: FormattedAdminStats
}

async function adminStats(_: FastifyRequest, reply: FastifyReply): Promise<void> {
  const stats = await Promise.all([
    getCpuUsagePercentP(),
    db.getDBStats(),
    db.getCountOfAllPostsWithMediaStillToDownload(),
    getFolderSize(postsMediaFolder),
    db.getLastScheduledUpdateTime(),
    Promise.resolve(process.memoryUsage().rss),
    Promise.resolve(process.uptime()),
  ]).then(processResults)

  const replyWithLocals = reply as { locals: StatsTemplateLocals } & FastifyReply

  // eslint-disable-next-line functional/immutable-data
  replyWithLocals.locals = { stats }
}

export { adminStats }
