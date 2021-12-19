import prettyBytes from 'pretty-bytes'
import type { Tabulator } from 'tabulator-tables'
import type { FrontendDownload } from './admin-downloads-viewer'

const tableColumns: Tabulator.ColumnDefinition[] = [
  {
    title: 'Post Id',
    field: 'id',
    hozAlign: 'center',
    formatter(cell): string {
      console.log('here')
      const postId = cell.getValue() as string
      // const { permalink } = cell.getRow().getData() as FrontendDownload
      // console.log(
      //   `<a href="https://www.reddit.com${permalink}" target="_blank" rel="noopener noreferrer">${postId}</a>`
      // )
      // return `<a href="https://www.reddit.com${permalink}" target="_blank" rel="noopener noreferrer">${postId}</a>`
      return `<span style='color:red; font-weight:bold;'>${postId}</span>`
    },
    tooltip(): string {
      return `Click to open downloads reddit post page.`
    },
  },
  {
    title: 'URL',
    field: 'url',
    hozAlign: 'left',
    responsive: 2,
    resizable: true,
    tooltip: true,
  }, //(have this be clipped if its long)
  { title: 'Status', field: 'status', hozAlign: 'center', tooltip: true },
  {
    title: 'Progress',
    field: 'downloadProgress',
    hozAlign: 'center',
    formatter(cell): string {
      console.log('here 2')
      const progressPercentage = cell.getValue() as number

      return `${progressPercentage} %`
    },
    tooltip: true,
  },
  {
    title: 'Size',
    field: 'size',
    hozAlign: 'center',
    formatter(cell): string {
      const { downloadedBytes, downloadFileSize } = cell.getRow().getData() as FrontendDownload

      return `${prettyBytes(downloadedBytes)} of ${prettyBytes(downloadFileSize)}`
    },
    tooltip: true,
  },
  {
    title: 'Speed',
    field: 'downloadSpeed',
    hozAlign: 'center',
    formatter(cell): string {
      const { downloadSpeed } = cell.getRow().getData() as FrontendDownload

      return `${prettyBytes(downloadSpeed)}`
    },
    tooltip: true,
  },
]

export { tableColumns }
