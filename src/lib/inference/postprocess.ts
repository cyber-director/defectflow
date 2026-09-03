// Shared postprocessing. See CLAUDE.md §39.
//
// !! ASSUMPTION THIS FILE MAKES !!
// This assumes an Ultralytics YOLOv8/v11-style ONNX export: output
// shape [1, 4 + numClasses, numBoxes] — box coords (center-x, center-y,
// width, height, in MODEL_INPUT_SIZE-relative pixels) in the first four
// rows, one row of class scores per remaining row. Ultralytics does NOT
// bake NMS into the graph unless you pass `nms=True` at export time, so
// this does it manually below.
//
// If your trained model uses a different architecture or export
// configuration, this is the one function that needs adjusting —
// everything downstream (aggregation, severity, priority, the UI) is
// agnostic to model architecture.

import { CLASS_INDEX } from '@/config/defects'
import type { Detection, DefectType } from '@/types/domain'
import type { LetterboxMeta } from './preprocess'

export const CONFIDENCE_THRESHOLD = 0.35
const IOU_THRESHOLD = 0.45

type Box = [number, number, number, number] // x, y, w, h

interface Candidate {
  defect: DefectType
  confidence: number
  box: Box
}

export function decodeYoloOutput(
  output: Float32Array,
  numBoxes: number,
  numClasses: number,
  letterbox: LetterboxMeta
): Detection[] {
  const candidates: Candidate[] = []

  for (let i = 0; i < numBoxes; i++) {
    let bestClass = -1
    let bestScore = 0
    for (let c = 0; c < numClasses; c++) {
      const score = output[(4 + c) * numBoxes + i]
      if (score > bestScore) {
        bestScore = score
        bestClass = c
      }
    }
    if (bestClass === -1 || bestScore < CONFIDENCE_THRESHOLD) continue

    const defect = CLASS_INDEX[bestClass]
    if (!defect) continue

    const cx = output[0 * numBoxes + i]
    const cy = output[1 * numBoxes + i]
    const w = output[2 * numBoxes + i]
    const h = output[3 * numBoxes + i]

    candidates.push({
      defect,
      confidence: bestScore,
      box: [cx - w / 2, cy - h / 2, w, h],
    })
  }

  return nonMaxSuppression(candidates).map(({ defect, confidence, box }) => {
    const [x, y, width, height] = mapBoxToOriginal(box, letterbox)
    const areaRatio = (width * height) || 0
    return {
      defect,
      confidence,
      box: { x, y, width, height },
      areaRatio: Math.max(0, Math.min(1, areaRatio)),
    }
  })
}

function mapBoxToOriginal([x, y, w, h]: Box, meta: LetterboxMeta): Box {
  const { scale, padX, padY, origWidth, origHeight } = meta
  const ox = (x - padX) / scale
  const oy = (y - padY) / scale
  const ow = w / scale
  const oh = h / scale
  return [
    Math.max(0, Math.min(1, ox / origWidth)),
    Math.max(0, Math.min(1, oy / origHeight)),
    Math.max(0, Math.min(1, ow / origWidth)),
    Math.max(0, Math.min(1, oh / origHeight)),
  ]
}

function iou(a: Box, b: Box): number {
  const [ax, ay, aw, ah] = a
  const [bx, by, bw, bh] = b
  const x1 = Math.max(ax, bx)
  const y1 = Math.max(ay, by)
  const x2 = Math.min(ax + aw, bx + bw)
  const y2 = Math.min(ay + ah, by + bh)
  const interArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const union = aw * ah + bw * bh - interArea
  return union <= 0 ? 0 : interArea / union
}

function nonMaxSuppression(candidates: Candidate[]): Candidate[] {
  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence)
  const kept: Candidate[] = []

  for (const candidate of sorted) {
    if (!kept.some((k) => iou(k.box, candidate.box) > IOU_THRESHOLD)) {
      kept.push(candidate)
    }
  }

  return kept
}
