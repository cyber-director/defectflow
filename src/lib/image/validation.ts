// Runs before any compression/inference work — reject obviously bad
// input early with a clear message (CLAUDE.md §55).

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024 // 25MB — generous, since we compress before sending

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Please choose a JPEG, PNG, or WebP photo.'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'That photo is too large. Please choose a smaller file.'
  }
  return null
}
