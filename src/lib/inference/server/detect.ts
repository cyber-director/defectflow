// Server-authoritative detection. This is the result that actually
// gets saved — the browser's result is only ever a UX preview
// (CLAUDE.md §16, §18). Automatically falls back to the stub detector
// when models/defect_detector.onnx doesn't exist yet, loudly, so it's
// impossible to miss in the logs.

import 'server-only'
import { existsSync } from 'node:fs'
import path from 'node:path'
// @ts-ignore
import * as ort from 'onnxruntime-node'
import sharp from 'sharp'
import { computeLetterbox, rgbBytesToNchwTensor, MODEL_INPUT_SIZE } from '../preprocess'
import { decodeYoloOutput } from '../postprocess'
import { aggregateDetections } from '../aggregate'
import { stubDetect } from '../stub'
import { DEFECT_TYPES } from '@/config/defects'
import type { DetectorOutput } from '@/types/domain'

const MODEL_PATH = process.env.MODEL_PATH || 'models/defect_detector.onnx'
const MODEL_VERSION = process.env.MODEL_VERSION || '1.0.0'

// Cached across requests within the same server process — see
// CLAUDE.md §33. Never create a new session per image.
let sessionPromise: Promise<ort.InferenceSession> | null = null

function resolvedModelPath() {
  return path.resolve(process.cwd(), MODEL_PATH)
}

export function modelExists(): boolean {
  return existsSync(resolvedModelPath())
}

function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(resolvedModelPath(), {
      executionProviders: ['cpu'],
    })
  }
  return sessionPromise as any
}

async function runRealModel(buffer: Buffer) {
  const image = sharp(buffer)
  const metadata = await image.metadata()
  const origWidth = metadata.width ?? MODEL_INPUT_SIZE
  const origHeight = metadata.height ?? MODEL_INPUT_SIZE
  const letterbox = computeLetterbox(origWidth, origHeight)

  const scaledW = Math.round(origWidth * letterbox.scale)
  const scaledH = Math.round(origHeight * letterbox.scale)

  const { data } = await image
    .resize(scaledW, scaledH, { fit: 'fill' })
    .extend({
      top: letterbox.padY,
      bottom: Math.max(0, MODEL_INPUT_SIZE - scaledH - letterbox.padY),
      left: letterbox.padX,
      right: Math.max(0, MODEL_INPUT_SIZE - scaledW - letterbox.padX),
      background: { r: 114, g: 114, b: 114 },
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const tensorData = rgbBytesToNchwTensor(new Uint8Array(data))
  const tensor = new ort.Tensor('float32', tensorData, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE])

  const session = await getSession()
  const inputName = session.inputNames[0]
  const outputName = session.outputNames[0]
  const results = await session.run({ [inputName]: tensor })
  const output = results[outputName]

  // Ultralytics-style [1, 4+numClasses, numBoxes] — see postprocess.ts
  // for the full assumption this relies on.
  const numBoxes = output.dims[2]
  return decodeYoloOutput(output.data as Float32Array, numBoxes, DEFECT_TYPES.length, letterbox)
}

export async function analyzeImageOnServer(buffer: Buffer): Promise<DetectorOutput> {
  const start = performance.now()

  if (modelExists()) {
    try {
      const detections = await runRealModel(buffer)
      const inferenceMs = Math.round(performance.now() - start)
      return aggregateDetections(detections, { modelVersion: MODEL_VERSION, inferenceMs })
    } catch (err) {
      console.error('[inference] Real model failed, falling back to stub for this request:', err)
    }
  } else {
    console.warn(
      `[inference] ${MODEL_PATH} not found — using the deterministic STUB detector. ` +
        'Fine for local development; must NOT be what ships for evaluation/deployment.'
    )
  }

  const detections = stubDetect(new Uint8Array(buffer))
  const inferenceMs = Math.round(performance.now() - start)
  return aggregateDetections(detections, { modelVersion: 'stub-v0', inferenceMs })
}
