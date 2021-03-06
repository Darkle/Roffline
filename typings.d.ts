declare module 'fastify-no-additional-properties'
declare module 'fastify-error-page'

declare module 'fastify-disablecache' {
  import disableCache from 'fastify-disablecache'
  export default disableCache
}

declare module 'fastify-api-logger'

declare module 'diceware' {
  export default function (numwords?: number): string
}

/*****
  The splide carousel library imports ./SplideSlide/SplideSlide.vue, which tsc
  doesnt understand. Found this hack here: https://github.com/vuejs/vue/issues/5298#issuecomment-611345474
  whith this followup: https://github.com/vuejs/vue/issues/5298#issuecomment-761577986.
*****/
declare module '*.vue' {
  import type { defineComponent } from 'vue'
  const component: ReturnType<typeof defineComponent>
  export default component
}

declare module 'prettify-time' {
  export default function (number): string
}

declare module 'cpu-stat' {
  function usagePercent(callback: (error: Error, percent: number, seconds: number) => void): void
  export { usagePercent }
}

declare module 'vue-good-table-next' {
  import { VueGoodTable } from 'vue-good-table-next'
  export default VueGoodTable
}

declare module 'vue3-json-viewer' {
  import JsonViewer from 'vue3-json-viewer'
  export default JsonViewer
}

declare module 'dns-cache' {
  export default function (ttl: number): void
}

declare module 'deep-filter' {
  function recursiveObjFilter(
    obj: Record<string, unknown>,
    callback: (value: any, prop: number | string) => boolean
  ): Record<string, unknown>
  export default recursiveObjFilter
}

declare module 'node-recursive-directory' {
  // prettier-ignore
  export default function (dir: string, asObject: boolean): Promise<{ fullpath: string; filepath: string; filename: string; dirname: string }[]>; // eslint-disable-line import/export,@typescript-eslint/semi
  export default function (dir: string): Promise<string[]> // eslint-disable-line import/export
}
