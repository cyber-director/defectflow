'use client'

// Client-side compression before upload (CLAUDE.md §17). Re-encoding
// through <canvas> also strips EXIF/GPS metadata as a side effect —
// canvas never preserves it, so no separate EXIF-stripping step is
// needed.

export interface CompressedImage {
  blob: Blob
  width: number
  height: number
}

async function resizeToBlob(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number
): Promise<CompressedImage> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality)
  )
  if (!blob) throw new Error('Failed to encode image')

  return { blob, width, height }
}

/**
 * Produces the main upload image (max 1600px, ~1-2MB target) and its
 * thumbnail (max 400px, ~40-120KB target) from a raw File.
 */
export async function compressForUpload(file: File): Promise<{
  main: CompressedImage
  thumbnail: CompressedImage
}> {
  const bitmap = await createImageBitmap(file)
  try {
    const [main, thumbnail] = await Promise.all([
      resizeToBlob(bitmap, 1600, 0.82),
      resizeToBlob(bitmap, 400, 0.75),
    ])
    return { main, thumbnail }
  } finally {
    bitmap.close()
  }
}
