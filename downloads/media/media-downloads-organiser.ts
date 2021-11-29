import { EventEmitter } from 'events'

class MediaDownloadsOrganiser extends EventEmitter {}

const mediaDownloadsOrganiser = new MediaDownloadsOrganiser()

export { mediaDownloadsOrganiser }
