// import { LoginPageReturnType } from './frontend/js/login'

declare module 'fastify-no-additional-properties'
declare module 'fastify-error-page'
declare module 'fastify-disablecache'

/* eslint-disable functional/prefer-type-literal*/

declare global {
  interface Window {
    csrfToken: string
  }
}
