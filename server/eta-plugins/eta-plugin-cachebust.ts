const regex = /^\s*@cachebust\s*\(\s*["'`]([^"'`]*)["'`],?([^]*)\)$/gu

// https://eta.js.org/docs/api/parsing
type BufferType = 'i' | 'r' | 'e'

type AstBufferType = Array<string | { t: BufferType; val: string }>

function processAST(buffer: AstBufferType, _: unknown): AstBufferType {
  buffer.forEach(currItem => {
    // eslint-disable-next-line functional/no-conditional-statement
    if (typeof currItem !== 'string') return

    // eslint-disable-next-line functional/no-conditional-statement
    if (regex.test(currItem)) {
      const firstHalf = currItem.split('@cachebust(')[1]?.trim() as string
      // eslint-disable-next-line functional/immutable-data,no-param-reassign, @typescript-eslint/restrict-plus-operands
      currItem = firstHalf.slice(0, firstHalf.lastIndexOf(')')).replace(/['"]/gu, ``).trim() + Date.now()
    }
  })
  return buffer
}

export default { processAST }
