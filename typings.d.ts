declare module 'fastify-no-additional-properties'
declare module 'fastify-error-page'
declare module 'fastify-disablecache'
declare module 'fastify-api-logger'

declare module 'js-ago' {
  export default function jsAgo(
    timestamp: Date | number,
    options?: {
      format: 'short' | 'medium' | 'long'
    }
  ): string
}
