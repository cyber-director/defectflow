// Sweeps the repo for leftover terminology from the old BugTrack app,
// and flags the old 5-status workflow for manual double-checking, so
// nothing stale slips into what gets submitted or deployed.
//
// Usage:
//   npm run validate:submission

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const FORBIDDEN_TERMS = ['BugTrack', 'Aedura', 'bcryptjs', 'APPS_SCRIPT_URL', 'JWT_SECRET', 'bugtracker_session']

// The old 5-status workflow. These are only ever expected inside
// historical comments explaining what got removed — this script can't
// tell a comment from live code, so it warns rather than fails, and a
// human makes the final call.
const FORBIDDEN_STATUSES = ['"Testing"', "'Testing'", '"Fixed"', "'Fixed'", '"Closed"', "'Closed'"]

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'runs', 'dataset', 'out'])
const CHECK_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.sql'])
// This file legitimately contains the strings above as data, and
// CLAUDE.md is the design brief itself — it describes the BEFORE state
// on purpose. Neither should be flagged.
const SKIP_FILES = new Set(['validate-submission.ts', 'CLAUDE.md', 'DEFECTFLOW_CLAUDE_IMPLEMENTATION_BRIEF.md'])

let issues = 0

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || SKIP_FILES.has(entry)) continue
    const full = path.join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full)
    } else if (CHECK_EXTENSIONS.has(path.extname(entry))) {
      checkFile(full)
    }
  }
}

function checkFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')

  for (const term of FORBIDDEN_TERMS) {
    if (content.includes(term)) {
      console.error(`✗ ${filePath}: contains "${term}"`)
      issues++
    }
  }

  for (const status of FORBIDDEN_STATUSES) {
    if (content.includes(status)) {
      console.warn(`⚠ ${filePath}: contains ${status} — verify this isn't a live status value`)
    }
  }
}

walk('.')

if (issues === 0) {
  console.log('\n✓ No forbidden terminology found.')
  process.exit(0)
} else {
  console.error(`\n✗ ${issues} issue(s) found.`)
  process.exit(1)
}
