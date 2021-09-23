import path from 'node:path'
// type unused = unknown
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

export {
  isDev,
  getEnvFilePath,
  noop,
  strOrArrayOfStrToLowerCase,
  isNonEmptyArray,
  encaseInArrayIfNotArray,
  arrayToLowerCase,
}
