// Copies the exported ONNX model into place for both the server
// (models/) and the browser (public/models/) to pick up, and records a
// content hash + timestamp so it's traceable which export is currently
// active. Deliberately NOT wired into predev/prebuild — the app must
// keep working via the stub detector even when no model has been
// synced yet, so this only runs when you explicitly ask for it.
//
// Usage:
//   npm run model:sync -- path/to/best.onnx
// or, if you've already copied the file to models/defect_detector.onnx yourself:
//   npm run model:sync

import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DEST_SERVER = path.resolve('models/defect_detector.onnx')
const DEST_PUBLIC = path.resolve('public/models/defect_detector.onnx')
const METADATA_PATH = path.resolve('models/metadata.json')

function main() {
  const sourceArg = process.argv[2]
  const source = sourceArg ? path.resolve(sourceArg) : DEST_SERVER

  if (!existsSync(source)) {
    console.error(
      sourceArg
        ? `File not found: ${source}`
        : `${DEST_SERVER} doesn't exist yet. Either place your exported model there, ` +
            `or run: npm run model:sync -- path/to/best.onnx`
    )
    process.exit(1)
  }

  mkdirSync(path.dirname(DEST_SERVER), { recursive: true })
  mkdirSync(path.dirname(DEST_PUBLIC), { recursive: true })

  if (path.resolve(source) !== DEST_SERVER) {
    copyFileSync(source, DEST_SERVER)
  }
  copyFileSync(DEST_SERVER, DEST_PUBLIC)

  const hash = createHash('sha256').update(readFileSync(DEST_SERVER)).digest('hex').slice(0, 12)
  writeFileSync(
    METADATA_PATH,
    JSON.stringify(
      {
        modelHash: hash,
        syncedAt: new Date().toISOString(),
        sourceFile: sourceArg ?? '(already at models/defect_detector.onnx)',
      },
      null,
      2
    )
  )

  console.log(`Model synced to:\n  ${DEST_SERVER}\n  ${DEST_PUBLIC}`)
  console.log(`Hash: ${hash}`)
  console.log('Restart `npm run dev` (or redeploy) to pick it up.')
}

main()
