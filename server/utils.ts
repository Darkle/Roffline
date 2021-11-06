import path from 'path'
import fs from 'fs'

// import * as R from 'ramda'

import { TableModels, TableModelTypes } from '../db/entities/entity-types'

const isDev = process.env['NODE_ENV'] === 'development'

const isAbsolutePath = (pth = ''): boolean => pth.startsWith('/')

const getEnvFilePath = (pth = ''): string => (isAbsolutePath(pth) ? pth : path.join(process.cwd(), pth))

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => {}

const strOrArrayOfStrToLowerCase = (thingOrThings: string | string[]): string | string[] =>
  Array.isArray(thingOrThings) ? thingOrThings.map(thing => thing.toLowerCase()) : thingOrThings.toLowerCase()

function encaseInArrayIfNotArray<Type>(thing: Type): Type[] {
  return Array.isArray(thing) ? thing : [thing]
}

function isNonEmptyArray<Type>(thing: Type): boolean {
  return Array.isArray(thing) && thing.length > 0
}

function arrayToLowerCase(arr: string[]): string[] {
  return arr.map(thing => thing.toLowerCase())
}

async function ensurePostsMediaDownloadFolderExists(): Promise<void | fs.Stats> {
  const postsMediaFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

  /*****
     We want to ignore errors of the folder not being there.
     Using stat instead of access as access returns nothing when successfull.
  *****/
  const folderExists = await fs.promises.stat(postsMediaFolder).catch(noop)

  // eslint-disable-next-line functional/no-conditional-statement
  if (!folderExists) {
    await fs.promises.mkdir(postsMediaFolder, { recursive: true })
  }
}

// Modified version of https://github.com/alessioalex/get-folder-size
async function getFolderSize(folderPath: string): Promise<number> {
  const fileSizes: Map<number, number> = new Map()

  async function processItem(itemPath: string): Promise<void> {
    const stats = await fs.promises.lstat(itemPath)

    // eslint-disable-next-line functional/no-conditional-statement
    if (typeof stats !== 'object') return
    fileSizes.set(stats.ino, stats.size)

    // eslint-disable-next-line functional/no-conditional-statement
    if (stats.isDirectory()) {
      const directoryItems = await fs.promises.readdir(itemPath)
      // eslint-disable-next-line functional/no-conditional-statement
      if (typeof directoryItems !== 'object') return
      await Promise.all(directoryItems.map(directoryItem => processItem(path.join(itemPath, directoryItem))))
    }
  }

  await processItem(folderPath)

  const folderSize = Array.from(fileSizes.values()).reduce((total, fileSize) => total + fileSize, 0)

  return folderSize
}

const ModeltoPOJO = (model: TableModels | undefined): TableModelTypes | undefined =>
  model?.get() as TableModelTypes | undefined

export {
  isDev,
  getEnvFilePath,
  noop,
  strOrArrayOfStrToLowerCase,
  isNonEmptyArray,
  encaseInArrayIfNotArray,
  arrayToLowerCase,
  ensurePostsMediaDownloadFolderExists,
  getFolderSize,
  ModeltoPOJO,
}
