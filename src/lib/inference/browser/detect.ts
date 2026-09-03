'use client'

// Client-side ONNX preview shown while the user is still on the form.
// This result is NEVER trusted for persistence (CLAUDE.md §16) — the
// server re-runs analysis on submit and that result is what's saved.
//
// If the browser can't load/run the model (unsupported device, or the
// model file simply doesn't exist yet in stub mode), this falls back
// to asking the server's own /api/analyze endpoint for a preview
// instead, per CLAUDE.md §16 — still not persisted, just so the form
// isn't blank while the user picks a photo.

import { computeLetterbox, rgbBytesToNchwTensor, MODEL_INPUT_SIZE } from '../preprocess'
import { decodeYoloOutput } from '../postprocess'
import { aggregateDetections } from '../aggregate'
import { DEFECT_TYPES } from '@/config/defects'
import type { DetectorOutput } from '@/types/domain'

const MODEL_URL = process.env.NEXT_PUBLIC_MODEL_URL || '/models/defect_detector.onnx'
const MODEL_VERSION = process.env.NEXT_PUBLIC_MODEL_VERSION || '1.0.0'

let sessionPromise: Promise<any> | null = null

function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import('onnxruntime-web')
      return ort.InferenceSession.create(MODEL_URL)
    })()
  }
  return sessionPromise
}

/** Call once when the "Report a defect" page mounts so the session is
 *  already warm by the time the user picks a photo (CLAUDE.md §33). */
export function preloadBrowserModel() {
  getSession().catch(() => {
    // Swallowed on purpose — analyzeImageInBrowser() falls back to the
    // server preview if the session never loads.
  })
}

async function letterboxFileToTensor(file: File) {
  const bitmap = await createImageBitmap(file)
  const letterbox = computeLetterbox(bitmap.width, bitmap.height)

  const canvas = document.createElement('canvas')
  canvas.width = MODEL_INPUT_SIZE
  canvas.height = MODEL_INPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.fillStyle = 'rgb(114,114,114)'
  ctx.fillRect(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)

  const scaledW = Math.round(bitmap.width * letterbox.scale)
  const scaledH = Math.round(bitmap.height * letterbox.scale)
  ctx.drawImage(bitmap, letterbox.padX, letterbox.padY, scaledW, scaledH)

  const { data } = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)
  const rgb = new Uint8Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3)
  for (let i = 0; i < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; i++) {
    rgb[i * 3] = data[i * 4]
    rgb[i * 3 + 1] = data[i * 4 + 1]
    rgb[i * 3 + 2] = data[i * 4 + 2]
  }

  return { tensor: rgbBytesToNchwTensor(rgb), letterbox }
}

async function analyzeViaServer(file: File): Promise<DetectorOutput> {
  const formData = new FormData()
  formData.append('image', file)
  const res = await fetch('/api/analyze', { method: 'POST', body: formData })
  if (!res.ok) throw new Error(`Server analysis failed (${res.status})`)
  return res.json()
}

export async function analyzeImageInBrowser(file: File): Promise<DetectorOutput> {
  try {
    const ort = await import('onnxruntime-web')
    const session = await getSession()
    const { tensor, letterbox } = await letterboxFileToTensor(file)

    const inputTensor = new ort.Tensor('float32', tensor, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE])
    const inputName = session.inputNames[0]
    const outputName = session.outputNames[0]
    const results = await session.run({ [inputName]: inputTensor })
    const output = results[outputName]
    const numBoxes = output.dims[2]

    const detections = decodeYoloOutput(
      output.data as Float32Array,
      numBoxes,
      DEFECT_TYPES.length,
      letterbox
    )

    return aggregateDetections(detections, { modelVersion: MODEL_VERSION })
  } catch (err) {
    console.warn('[inference] Browser ONNX preview unavailable, using server preview instead:', err)
    return analyzeViaServer(file)
  }
}
