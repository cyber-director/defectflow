// Sanity-checks the priority/queue math against the domain rules,
// independent of any database or running server.
//
// Usage:
//   npm run test:queue

import { calculateSeverityScore, severityLabelFor } from '../src/lib/priority/severity'
import { calculatePriority } from '../src/lib/priority/calculate'
import { computeQueuePosition, sortByQueueOrder, type QueueRankable } from '../src/lib/queue/rank'

let failures = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`)
  } else {
    failures++
    console.error(`✗ ${message}`)
  }
}

// Rule: any Cracked Tiles complaint outranks any Paint Peeling
// complaint, regardless of severity, within Performance.
const lowSeverityCracked = calculatePriority('cracked_tiles', 0.05)
const highSeverityPaint = calculatePriority('paint_peeling', 0.99)
assert(
  lowSeverityCracked > highSeverityPaint,
  `Low-severity Cracked Tiles (${lowSeverityCracked.toFixed(1)}) outranks ` +
    `high-severity Paint Peeling (${highSeverityPaint.toFixed(1)})`
)

// Rule: severity increases monotonically with visible extent.
const low = calculateSeverityScore({ visibleExtent: 0.05, largestRegion: 0.05, detectionCount: 1 })
const high = calculateSeverityScore({ visibleExtent: 0.5, largestRegion: 0.3, detectionCount: 3 })
assert(high > low, `Larger visible extent produces higher severity (${high.toFixed(2)} > ${low.toFixed(2)})`)
assert(severityLabelFor(low) === 'Low', 'Low extent maps to "Low" severity label')
assert(severityLabelFor(high) === 'High', 'Large extent maps to "High" severity label')

// Rule: queue order is priority DESC, then created_at ASC.
const now = Date.now()
const sample: QueueRankable[] = [
  { id: 'a', priorityScore: 50, createdAt: new Date(now - 3000).toISOString() },
  { id: 'b', priorityScore: 90, createdAt: new Date(now - 2000).toISOString() },
  { id: 'c', priorityScore: 90, createdAt: new Date(now - 1000).toISOString() },
  { id: 'd', priorityScore: 20, createdAt: new Date(now).toISOString() },
]
const sorted = sortByQueueOrder(sample)
const order = sorted.map((c) => c.id).join(',')
assert(order === 'b,c,a,d', `Queue order is priority DESC then created_at ASC (got: ${order})`)
assert(computeQueuePosition(sample[2], sample) === 2, `Tied priority, later arrival -> position 2 (behind 'b')`)
assert(computeQueuePosition(sample[1], sample) === 1, `Tied priority, earlier arrival -> position 1`)

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
