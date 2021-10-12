import path from 'path'
import fs from 'fs'

import * as R from 'ramda'
// type unused = unknown

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

const ModeltoPOJO = (model: TableModels | undefined): TableModelTypes | undefined =>
  model?.get() as TableModelTypes | undefined

function omitDuplicateSubs(currentSubs: string[], newSubs: string[]): string[] {
  const currentSubsLowercase = currentSubs.length ? currentSubs.map((sub: string) => sub.toLowerCase()) : []
  // Lowercase new subs in case they misstype and add a duplicate - e.g. Cats and then CAts
  const newSubsLowercase = newSubs.map((sub: string) => sub.toLowerCase())

  return R.uniq([...currentSubsLowercase, ...newSubsLowercase])
}

// function getProperty<K extends keyof T, T>(propertyName: K, o: T): T[K] {
//   return o[propertyName] // o[propertyName] is of type T[K]
// }

type GetTextPropCurriedReturnType = string | ((obj: Record<string, unknown>) => string)

function getTextPropCurried(propertyName: string, obj: Record<string, unknown>): GetTextPropCurriedReturnType {
  return arguments.length === 2
    ? (obj[propertyName] as string)
    : // eslint-disable-next-line @typescript-eslint/no-shadow
      function (obj: Record<string, unknown>): string {
        return obj[propertyName] as string
      }
}

export {
  isDev,
  getEnvFilePath,
  noop,
  strOrArrayOfStrToLowerCase,
  isNonEmptyArray,
  encaseInArrayIfNotArray,
  arrayToLowerCase,
  ensurePostsMediaDownloadFolderExists,
  omitDuplicateSubs,
  ModeltoPOJO,
  getTextPropCurried,
}
