import path from 'node:path'
// type unused = unknown
const isDev = process.env['NODE_ENV'] === 'development'

const isAbsolutePath = (pth = ''): boolean => pth.startsWith('/')

const getEnvFilePath = (pth = ''): string => (isAbsolutePath(pth) ? pth : path.join(process.cwd(), pth))

export { isDev, getEnvFilePath }