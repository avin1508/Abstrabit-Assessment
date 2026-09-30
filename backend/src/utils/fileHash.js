import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'

// SHA-256 of a file on disk, streamed so large uploads aren't loaded into memory.
export function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', reject)
  })
}
