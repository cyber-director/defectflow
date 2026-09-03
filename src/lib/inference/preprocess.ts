// Shared preprocessing — the browser and server detectors both call
// into this so a photo is guaranteed to be resized/normalized exactly
// the same way regardless of which one runs. See CLAUDE.md §39.
//
// No 'use client' / 'server-only' markers here on purpose: this file
// has zero DOM and zero Node dependencies, just math, so it's safe to
// import from either side.

export const MODEL_INPUT_SIZE = 512

export interface LetterboxMeta {
  scale: number
  padX: number
  padY: number
  origWidth: number
  origHeight: number
}

/** Computes the resize+pad transform to fit an image into a
 *  MODEL_INPUT_SIZE square without distorting its aspect ratio. */
export function computeLetterbox(origWidth: number, origHeight: number): LetterboxMeta {
  const scale = Math.min(MODEL_INPUT_SIZE / origWidth, MODEL_INPUT_SIZE / origHeight)
  const scaledW = Math.round(origWidth * scale)
  const scaledH = Math.round(origHeight * scale)
  const padX = Math.floor((MODEL_INPUT_SIZE - scaledW) / 2)
  const padY = Math.floor((MODEL_INPUT_SIZE - scaledH) / 2)
  return { scale, padX, padY, origWidth, origHeight }
}

/**
 * Converts a MODEL_INPUT_SIZE × MODEL_INPUT_SIZE RGB byte buffer
 * (row-major, 3 bytes/pixel, already letterboxed) into a normalized
 * NCHW Float32Array ready for the ONNX session.
 */
export function rgbBytesToNchwTensor(rgb: Uint8Array): Float32Array {
  const size = MODEL_INPUT_SIZE
  const plane = size * size
  const tensor = new Float32Array(3 * plane)

  for (let i = 0; i < plane; i++) {
    tensor[i] = rgb[i * 3] / 255 // R plane
    tensor[plane + i] = rgb[i * 3 + 1] / 255 // G plane
    tensor[plane * 2 + i] = rgb[i * 3 + 2] / 255 // B plane
  }

  return tensor
}
