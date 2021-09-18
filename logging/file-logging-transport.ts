import { Writable } from 'node:stream'

export default options => {
  const myTransportStream = new Writable({
    write(chunk: string | Buffer, _, cb): void {
      console.log(chunk.toString())
      cb()
    },
  })
  return myTransportStream
}
