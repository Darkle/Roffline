// type unused = unknown
// eslint-disable-next-line dot-notation, functional/functional-parameters
const isDev = (): boolean => process.env['NODE_ENV'] === 'development'

export { isDev }
