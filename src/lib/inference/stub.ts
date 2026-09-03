// Deterministic placeholder detector.
//
// !! DO NOT SUBMIT/DEPLOY THIS AS THE EVALUATED MODEL !! (CLAUDE.md §0
// rule 14, §58). It exists purely so the rest of the app — forms,
// Storage, the priority queue, staff workflow, Realtime — can be built
// and demoed correctly before the real trained model exists. The
// moment `models/defect_detector.onnx` is present,
// src/lib/inference/server/detect.ts stops calling this automatically.
//
// Deterministic (hashed from the image bytes) rather than random, so
// re-testing the same photo gives the same result — useful while
// verifying queue ordering end-to-end with repeatable inputs.

import { DEFECT_TYPES } from '@/config/defects'
import type { Detection } from '@/types/domain'

function hashBytes(buffer: Uint8Array): number {
  let hash = 2166136261
  // Sampling every 97th byte keeps this fast even on multi-MB images —
  // this is a cheap fingerprint, not a real hash function.
  for (let i = 0; i < buffer.length; i += 97) {
    hash ^= buffer[i]
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function stubDetect(imageBytes: Uint8Array): Detection[] {
  if (imageBytes.length === 0) return []

  const hash = hashBytes(imageBytes)
  const defect = DEFECT_TYPES[hash % DEFECT_TYPES.length]

  const extent = 0.06 + (((hash >>> 8) % 100) / 100) * 0.33 // ~0.06–0.39
  const confidence = 0.6 + (((hash >>> 16) % 100) / 100) * 0.33 // ~0.60–0.93

  return [
    {
      defect,
      confidence: Math.min(0.97, confidence),
      box: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
      areaRatio: Math.min(0.6, extent),
    },
  ]
}
