// Hits a running instance's /api/health and reports pass/fail per
// subsystem.
//
// Usage (local):
//   npm run dev                 (in one terminal)
//   npm run test:smoke          (in another)
//
// Usage (deployed):
//   BASE_URL=https://your-app.vercel.app npm run test:smoke

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function main() {
  console.log(`Checking ${BASE_URL}/api/health ...\n`)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/api/health`)
  } catch (err) {
    console.error(`✗ Could not reach ${BASE_URL} — is the app running?`)
    console.error(err)
    process.exit(1)
  }

  if (!res.ok) {
    console.error(`✗ /api/health returned HTTP ${res.status}`)
    process.exit(1)
  }

  const body = await res.json()

  const checks: [string, boolean][] = [
    ['app', body.app === 'ok'],
    ['database', body.database === 'ok'],
    ['storage', body.storage === 'ok'],
  ]

  let failed = false
  for (const [name, ok] of checks) {
    console.log(`${ok ? '✓' : '✗'} ${name}`)
    if (!ok) failed = true
  }

  console.log(
    body.model === 'onnx'
      ? '✓ model: real ONNX model is active'
      : '⚠ model: STUB detector is active — fine for local dev, but this must not be ' +
          'what you submit/deploy for evaluation'
  )

  process.exit(failed ? 1 : 0)
}

main()
