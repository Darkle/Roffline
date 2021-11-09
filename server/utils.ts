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

async function folderExists(folderPath: string): Promise<boolean> {
  /*****
     We want to ignore errors of the folder not being there.
     Using stat instead of access as access returns nothing when successfull.
  *****/
  const exists = await fs.promises.stat(folderPath).catch(noop)

  return !!exists
}

async function pDeleteFolder(folderPath: string): Promise<void> {
  const exists = await folderExists(folderPath)

  return exists ? fs.promises.rmdir(folderPath, { recursive: true }) : Promise.resolve()
}

async function ensurePostsMediaDownloadFolderExists(): Promise<void | fs.Stats> {
  const postsMediaFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

  const exists = await folderExists(postsMediaFolder)

  // eslint-disable-next-line functional/no-conditional-statement
  if (!exists) {
    await fs.promises.mkdir(postsMediaFolder, { recursive: true })
  }
}

const getFileSize = (filePath: string): Promise<number> => fs.promises.stat(filePath).then(result => result.size)

/*****
  Modified version of https://github.com/alessioalex/get-folder-size
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*****/
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
  getFileSize,
  getFolderSize,
  ModeltoPOJO,
  pDeleteFolder,
  folderExists,
}
