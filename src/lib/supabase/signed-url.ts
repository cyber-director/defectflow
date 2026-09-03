// Signed URLs are always generated via the admin client (CLAUDE.md §26)
// — the regular RLS-bound client has no storage grants at all, by
// design (see supabase/migrations/007_storage.sql). This is safe
// because every caller of these functions has already fetched the
// owning complaint row through the RLS-respecting client first, so
// we're only ever signing a path the caller was already allowed to see.

import 'server-only'
import { createAdminClient } from './admin'

const BUCKET = 'complaint-images'
const DEFAULT_EXPIRY_SECONDS = 3600

export async function getSignedUrl(
  path: string,
  expiresInSeconds = DEFAULT_EXPIRY_SECONDS
): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  return data?.signedUrl ?? null
}

export async function getSignedUrlMap(
  paths: string[],
  expiresInSeconds = DEFAULT_EXPIRY_SECONDS
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}

  const admin = createAdminClient()
  const { data } = await admin.storage.from(BUCKET).createSignedUrls(paths, expiresInSeconds)

  const map: Record<string, string> = {}
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) map[entry.path] = entry.signedUrl
  }
  return map
}
