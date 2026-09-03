// Creates (or updates) staff accounts using the service-role key. Safe
// to re-run: it looks up each account by email first instead of
// failing on a duplicate. Supports any number of staff per category.
//
// Usage:
//   npm run seed:staff
//
// Requires in .env.local, per category, per staff member:
//   STRUCTURAL_STAFF_1_EMAIL / STRUCTURAL_STAFF_1_PASSWORD / STRUCTURAL_STAFF_1_NAME
//   STRUCTURAL_STAFF_2_EMAIL / STRUCTURAL_STAFF_2_PASSWORD / STRUCTURAL_STAFF_2_NAME
//   ...same pattern for FUNCTIONAL_STAFF_n_* and PERFORMANCE_STAFF_n_*
//
// The numbering starts at 1 and stops at the first gap — define as many
// or as few staff per category as you want. The old single-staff
// convention (STRUCTURAL_STAFF_EMAIL, no number) still works too, and
// is treated as staff #1 if no numbered vars are set for that category.

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import type { StaffCategory } from '../src/types/domain'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Make sure .env.local is filled in, and run this with:\n' +
      '  npm run seed:staff'
  )
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  // Node < 22 workaround — see src/lib/supabase/server.ts for why.
  realtime: { transport: ws as any },
})

interface StaffSeed {
  category: StaffCategory
  email: string
  password: string
  fullName: string
}

const CATEGORIES: StaffCategory[] = ['Structural', 'Functional', 'Performance']

function loadStaffFromEnv(): StaffSeed[] {
  const staff: StaffSeed[] = []

  for (const category of CATEGORIES) {
    const prefix = category.toUpperCase()

    // Back-compat: the original single-staff-per-category convention
    // (no number) still works, counted as staff #1, as long as the
    // new numbered form isn't also set for #1.
    const legacyEmail = process.env[`${prefix}_STAFF_EMAIL`]
    const legacyPassword = process.env[`${prefix}_STAFF_PASSWORD`]
    if (legacyEmail && legacyPassword && !process.env[`${prefix}_STAFF_1_EMAIL`]) {
      staff.push({
        category,
        email: legacyEmail,
        password: legacyPassword,
        fullName: process.env[`${prefix}_STAFF_NAME`] || `${category} Maintenance Staff`,
      })
    }

    let i = 1
    while (true) {
      const email = process.env[`${prefix}_STAFF_${i}_EMAIL`]
      const password = process.env[`${prefix}_STAFF_${i}_PASSWORD`]
      if (!email || !password) break

      staff.push({
        category,
        email,
        password,
        fullName: process.env[`${prefix}_STAFF_${i}_NAME`] || `${category} Staff ${i}`,
      })
      i++
    }

    if (staff.filter((s) => s.category === category).length === 0) {
      console.warn(
        `⚠  No staff configured for ${category}. Set ${prefix}_STAFF_1_EMAIL / _PASSWORD / _NAME in .env.local.`
      )
    }
  }

  return staff
}

async function findUserByEmail(email: string) {
  // Fine for a handful of demo accounts. If this repo ever needs to seed
  // large user counts, page through listUsers() instead.
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) throw error
  return data.users.find((u) => u.email === email) ?? null
}

async function upsertStaff(entry: StaffSeed) {
  let userId: string

  const existing = await findUserByEmail(entry.email)
  if (existing) {
    userId = existing.id
    console.log(`${entry.category}: user already exists (${entry.email})`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: entry.email,
      password: entry.password,
      email_confirm: true,
      user_metadata: { full_name: entry.fullName },
    })
    if (error || !data.user) {
      console.error(`✗ ${entry.category}: failed to create user (${entry.email}) —`, error?.message)
      return
    }
    userId = data.user.id
    console.log(`${entry.category}: created user (${entry.email})`)
  }

  // The handle_new_user trigger already inserted a role='user' profile
  // row for a freshly created account. Promote it to staff here.
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      role: 'staff',
      staff_category: entry.category,
      full_name: entry.fullName,
    })
    .eq('id', userId)

  if (profileError) {
    console.error(`✗ ${entry.category}: failed to update profile (${entry.email}) —`, profileError.message)
  } else {
    console.log(`✓ ${entry.category}: ${entry.fullName} (${entry.email}) set to staff / ${entry.category}`)
  }
}

async function main() {
  const staff = loadStaffFromEnv()
  for (const entry of staff) {
    await upsertStaff(entry)
  }
}

main().then(() => process.exit(0))
