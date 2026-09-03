# DefectFlow

Photo-based facility maintenance triage. A user photographs a visible
defect (spalling, stagnant water, cracked tiles, or paint peeling); the
app detects it, scores its severity from how much of the photo it
covers, computes a priority score, and routes it to the correct
maintenance team's live, priority-ranked queue.

See `CLAUDE.md` in this repo for the full original design brief —
architecture rationale, exact formulas, and the reasoning behind every
decision below live there in more detail than this file repeats.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Postgres,
Auth, Storage, Realtime) · ONNX Runtime (browser + server) · Ultralytics
YOLOv8 for training.

## Status: what's real vs. stubbed right now

Everything **except the trained model** is fully wired and functional:
auth, roles, complaint submission, image storage, priority scoring,
the staff queue, status workflow, and Realtime updates all work
end-to-end today.

There is **no trained model yet**. Until you train one and run
`npm run model:sync`, `src/lib/inference/server/detect.ts`
automatically falls back to a deterministic stub detector (see the
comment at the top of `src/lib/inference/stub.ts`) so the rest of the
app can be built, demoed, and tested without waiting on training. The
stub is loud about it — check your server logs. **Do not submit or
deploy the app for evaluation while still on the stub** — see "Training
the real model" below.

## One-time setup

### 1. Create the Supabase project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New
   project. Pick the region closest to your users.
2. **Settings → API Keys** → copy the Project URL, publishable (or
   `anon`) key, and secret (or `service_role`) key.
3. **SQL Editor** → run every file in `supabase/migrations/` **in
   numeric order**, `001` through `010`. Order matters — later files
   reference tables/types earlier files create.
4. **Authentication → Providers → Email** → disable "Confirm email"
   (and "Secure email change") for local development, so signups don't
   need an inbox click. Re-enable for a real production deployment if
   you want it.
5. **Authentication → URL Configuration** → set Site URL to
   `http://localhost:3000` for now (update this when you deploy).
6. Verify: **Table Editor** shows `profiles`, `complaints`,
   `ticket_updates`; **Storage** shows a private `complaint-images`
   bucket (created by migration `007`, not by hand).

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the three Supabase values from step 1, plus an email/password
for each of the three staff accounts (`STRUCTURAL_STAFF_EMAIL`, etc —
any address works with email confirmation disabled).

### 3. Install and seed

Requires **Node 22+** — Supabase's client libraries dropped Node 20
support entirely as of June 30, 2026. Check with `node -v`.

```bash
npm install
npm run seed:staff
```

`seed:staff` is safe to re-run — it looks up each account by email
before creating one.

### 4. Run it

```bash
npm run dev
```

- Sign up a normal account at `/signup`.
- Log in with a seeded staff email at `/staff/login`.
- Submit a complaint as the user, then watch it appear live in the
  matching staff queue and move through status changes in real time.

## Repository layout

```
src/
  app/
    login/, signup/, staff/login/     - auth pages (Server Actions, no /api/auth/*)
    user/                             - reporter portal (dashboard, complaints, new)
    staff/                            - staff portal (queue, complaint detail)
    api/
      analyze/                        - browser ONNX fallback preview
      complaints/                     - POST: authoritative create (inference + storage + insert)
      staff/status/, staff/updates/   - staff mutations (role/category verified, admin client)
      health/                         - GET: db/storage/model status
  components/
    shell/    - Sidebar
    tickets/  - TicketCard, QueueRealtime
    activity/ - TicketActivity (Realtime timeline)
    inference/- AnalysisPreview
    ui/       - badges, StatusActions, StaffNoteForm
  lib/
    supabase/ - browser/server/admin/middleware clients, mappers, signed URLs
    inference/- shared preprocess/postprocess/aggregate + browser & server detectors + stub
    priority/ - severity + priority formulas
    queue/    - queue position/order logic
    image/    - client-side validation + compression
  config/defects.ts   - the one place the defect-to-category map lives
  types/domain.ts     - shared types (Detection, Complaint, status machine, etc.)
supabase/migrations/  - schema, RLS, triggers, storage bucket, Realtime - run in order
ml/                   - training pipeline (Python) - see below
scripts/              - seed-staff, sync-model, queue-test, smoke-test, validate-submission
models/               - defect_detector.onnx goes here (gitignored; see .gitignore)
```

## Training the real model

This part needs a labeled dataset and either a GPU or patience on CPU
- nothing here runs inside a chat assistant's sandbox, so this is
entirely on you (or point Claude Code at `ml/` once you have data).

```bash
cd ml
python -m venv .venv && source .venv/bin/activate   # or your preferred env manager
pip install -r requirements.txt

# 1. Split your labeled images into train/val/test
python scripts/prepare_dataset.py \
  --images path/to/raw/images --labels path/to/raw/labels \
  --out dataset --val-frac 0.15 --test-frac 0.15

# 2. Train
python scripts/train.py --config configs/train.yaml

# 3. Evaluate (prints per-class mAP50 for your report)
python scripts/evaluate.py --weights runs/defectflow/weights/best.pt

# 4. Export to ONNX at the fixed 512x512 input size the app expects
python scripts/export.py --weights runs/defectflow/weights/best.pt
```

Then, from the repo root:

```bash
npm run model:sync -- ml/runs/defectflow/weights/best.onnx
```

This copies the model to both `models/` (server) and `public/models/`
(browser), and writes `models/metadata.json` with a content hash.
Restart `npm run dev` - `/api/health` should now report `"model": "onnx"`
instead of `"model": "stub"`.

**If your export doesn't match the assumed output shape** (a different
architecture, or `nms=True` at export time), the one function to
adjust is `decodeYoloOutput` in `src/lib/inference/postprocess.ts` -
its assumption is documented at the top of that file. Nothing else in
the app needs to change.

## Testing

```bash
npm run test:queue    # priority/queue math, no server needed
npm run test:smoke    # hits a running instance's /api/health
npm run validate:submission   # sweeps for leftover BugTrack-era terms/statuses
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. vercel.com/new -> import the repo.
3. Add every variable from `.env.local` as a Vercel environment
   variable (Project Settings -> Environment Variables) - including the
   server-only `SUPABASE_SERVICE_ROLE_KEY`. Set `NEXT_PUBLIC_APP_URL`
   to your Vercel URL.
4. Deploy.
5. Back in Supabase, **Authentication -> URL Configuration** -> update
   Site URL to your Vercel URL.
6. `BASE_URL=https://your-app.vercel.app npm run test:smoke` to
   confirm the deployed instance is healthy.
7. If you've trained a real model, either commit `models/` (it's
   gitignored by default - remove that line in `.gitignore` if you
   want it in git) or upload it as part of your deploy process; Vercel
   needs the file present at build/runtime the same way local dev does.

`vercel.json` already targets the Mumbai region - adjust if you need a
different one.

## Design notes worth knowing before you extend this

- **Two-level navigation, not a persistent three-pane layout.**
  Ticket detail pages show the submission and activity timeline
  side-by-side, but the ticket *list* and ticket *detail* are separate
  pages rather than simultaneously-visible panes. This was a
  conscious scope call to prioritize the functional pipeline
  (detection -> priority -> routing -> realtime) within the time
  available - upgrading to a persistent list+detail layout later is
  straightforward and doesn't require touching any of the data layer.
- **No generated Supabase types.** Queries return `any`-ish rows;
  `src/lib/supabase/mappers.ts` is the one place that translates raw
  snake_case columns into the app's camelCase domain types. Running
  `supabase gen types typescript` and wiring it in is a good next step
  for stronger type safety.
- **The postprocessing shape is an assumption, not a certainty** - see
  the comment at the top of `src/lib/inference/postprocess.ts`.
- **`ws` transport workaround.** `src/lib/supabase/server.ts` and
  `admin.ts` pass an explicit `ws` WebSocket transport because
  Supabase's JS client now requires Node's native WebSocket (Node 22+).
  If this project's minimum Node version is ever raised and confirmed
  at 22+ everywhere it runs, that workaround (and the `ws` dependency)
  can be removed.
