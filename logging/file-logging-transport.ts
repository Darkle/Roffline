import path from 'node:path'

import rotatingFileStream, { RotatingFileStream } from 'rotating-file-stream'

type Options = {
  readonly outDir: string
}

const maxFiles = 5

export default (options: Options): RotatingFileStream =>
  rotatingFileStream.createStream(path.join(options.outDir, 'roffline.log'), {
    size: '5M',
    interval: '2d',
    maxFiles,
  })
