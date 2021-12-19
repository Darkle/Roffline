const tableColumns = [
  { title: 'Post Id', field: 'postId', hozAlign: 'center' }, // click on to open reddit post url
  { title: 'URL', field: 'url', hozAlign: 'left' }, //(have this be clipped if its long)
  { title: 'Status', field: 'status', hozAlign: 'center' }, //(eg downloading, finished, cancelled, skipped, failed)
  { title: 'Size', field: 'size', hozAlign: 'center' },
  { title: 'Speed', field: 'speed', hozAlign: 'center' },
  { title: 'Progress', field: 'progress', hozAlign: 'center' },
]

export { tableColumns }
