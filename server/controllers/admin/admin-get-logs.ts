import fs from 'fs'
import path from 'path'

import * as R from 'ramda'
import Prray from 'prray'

import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { getEnvFilePath } from '../../utils'

type Log = { level: string; time: string; name: string; msg: string } & Record<string, unknown>

type Logs = Log[]

const logDir = getEnvFilePath(process.env['LOGDIR'])

const isLogFile = R.endsWith('.log')

const getPathForFileInLogDir = (fileName: string): string => path.join(logDir, fileName)

const tryParseJson = R.tryCatch(
  logLineAsString => JSON.parse(logLineAsString) as Log,
  R.always({} as Record<string, never>)
)

const isNotEmptyObject = R.complement(R.isEmpty)

const convertLogsToJsonForTransport = (logLinesAsStringsArr: string[]): Logs =>
  logLinesAsStringsArr.map(logLine => tryParseJson(logLine)).filter(isNotEmptyObject) as Logs

const sortLogsLatestFirst = (logs: Logs): Logs => R.reverse(R.sortBy(R.prop('time'), logs))

const joinLogsAndRemoveEmptyLines = (logs: string[]): string[] =>
  logs.flatMap(logFile => logFile.split(/\n/gu)).filter(logLine => logLine.length > 0)

const getAllLogFileNames = (): Promise<string[]> => fs.promises.readdir(logDir).then(R.filter(isLogFile))

const readAllLogFiles = (): Promise<Logs> =>
  getAllLogFileNames()
    .then(logFilePaths =>
      Prray.from(logFilePaths).mapAsync(filePath =>
        fs.promises.readFile(getPathForFileInLogDir(filePath), { encoding: 'utf8' }).then(R.trim)
      )
    )
    .then(joinLogsAndRemoveEmptyLines)
    .then(convertLogsToJsonForTransport)
    .then(sortLogsLatestFirst)

async function getLogs(_: FastifyRequest, reply: FastifyReply): Promise<void> {
  const logData = await readAllLogFiles()

  reply.code(HttpStatusCode.OK).send(logData)
}

const formatLogsForDownload = R.compose(R.join('\n'), R.map(JSON.stringify))

function downloadLogs(_: FastifyRequest, reply: FastifyReply): Promise<void> {
  return readAllLogFiles()
    .then(formatLogsForDownload)
    .then(logDataAsText => {
      reply.header('Content-disposition', 'attachment; filename=rofflinelogs.txt')
      reply.type('txt')
      reply.send(logDataAsText)
    })
}

export { getLogs, downloadLogs }
