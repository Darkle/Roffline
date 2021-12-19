import type { Tabulator } from 'tabulator-tables'
import type { FrontendDownload } from './admin-downloads-viewer'

const tableColumns: Tabulator.ColumnDefinition[] = [
  {
    title: 'Post Id',
    field: 'postId',
    hozAlign: 'center',
    formatter(cell): string {
      const postId = cell.getValue() as string
      const { permalink } = cell.getRow().getData() as FrontendDownload

      return `<a href="https://www.reddit.com${permalink}" target="_blank" rel="noopener noreferrer">${postId}</a>`
    },
    tooltip(): string {
      return `Click to open downloads reddit post page.`
    },
  }, // click on to open reddit post url
  {
    title: 'URL',
    field: 'url',
    hozAlign: 'left',
    responsive: 2,
    resizable: true,
    tooltip: true,
  }, //(have this be clipped if its long)
  { title: 'Status', field: 'status', hozAlign: 'center', tooltip: true }, //(eg downloading, finished, cancelled, skipped, failed)
  { title: 'Size', field: 'size', hozAlign: 'center', tooltip: true },
  { title: 'Speed', field: 'speed', hozAlign: 'center', tooltip: true },
  {
    title: 'Progress',
    field: 'progress',
    hozAlign: 'center',
    formatter(cell): string {
      const progressPercentage = cell.getValue() as number

      return `${progressPercentage} %`
    },
    tooltip: true,
  },
]

export { tableColumns }
