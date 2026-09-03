# DefectFlow — 4-Hour Refactor, ML Integration, Supabase Migration & Vercel Deployment Brief

> **Purpose of this document:** hand this file, the original `bugtracking-master.zip`, the attached logo, and the problem statement to Claude (or another coding agent) and tell it to **edit the repository directly** until the application is locally runnable and deployable on Vercel.
>
> This is not a generic architecture note. It is a **repo-specific implementation brief** based on the original uploaded bug tracker and the competition problem statement.

---

## 0. Instructions to Claude / Coding Agent

You are acting as the senior full-stack + ML integration engineer for this repo. Work directly on the provided `bugtracking-master` repository.

### Hard rules

1. **Rename the product to `DefectFlow`.** Remove `Aedura`, `BugTrack`, `Bugtracker`, `tester`, `admin`, and bug-tracker-specific terminology from the user-facing product.
2. **Use the supplied logo** as the brand source. Copy it to `public/brand/logo.png` and theme the UI around its dark green/grey palette.
3. **Replace Google Sheets + Google Apps Script completely with Supabase**:
   - Supabase Auth
   - Supabase PostgreSQL
   - Supabase Storage for complaint images and thumbnails
   - Supabase Realtime for ticket/status updates
4. **Deploy the Next.js app on Vercel.** There should be no separately maintained custom server.
5. **No third-party AI/ML inference API is allowed.** Do not call OpenAI, Gemini, Roboflow hosted inference, Hugging Face hosted inference, etc. Detection/classification must run using our submitted model/checkpoint.
6. A generic backbone/checkpoint pre-trained on a **general-purpose dataset** (for example COCO/ImageNet) is allowed by the problem statement. A checkpoint already trained specifically on building defects, stagnant water, spalling, cracks, paint peeling, or similar is **not allowed**.
7. The visible model prediction shown during complaint entry is **non-editable**. The user cannot manually pick defect, category, severity, or priority.
8. Browser/client predictions are only a UX preview. The server must re-run the same model at submission and treat the server output as authoritative.
9. Keep the app working after each refactor stage. Do not perform a giant rewrite that leaves the repo unbuildable for hours.
10. Do not commit secrets, service-role keys, passwords, datasets with licensing issues, or `.env.local`.
11. Do not fabricate accuracy, mAP, latency, confusion-matrix, or benchmark numbers. Generate and record real values.
12. Prefer a **working competition solution in 4 hours** over architecture perfection. Mark optional polish as stretch work.
13. When you change something, explain it briefly to the developer using this repo: what file changed, why, and how to run/test it.
14. Before stopping, provide:
    - exact local run commands,
    - exact Supabase setup steps,
    - exact model training/export commands,
    - exact Vercel deploy steps,
    - demo credentials or the script that creates them,
    - a final smoke-test checklist.

### Expected coding-agent workflow

- Inspect existing repo first.
- Create a new branch such as `defectflow-refactor`.
- Make small commits or clearly separated change groups.
- Run TypeScript/build checks after major stages.
- Search the entire repo for obsolete terminology before finalizing.
- If the final model is not ready yet, create a clean `detectDefects()` interface with an explicit temporary stub **only during development**. The submitted/evaluated app must use the real local ONNX model.

---

# 1. Problem Statement — What the Finished System Must Do

The application is a **Photo-Based Defect Detection & Priority Maintenance Web System** for facilities such as buildings, hostels, hospitals, and commercial complexes.

A user reports a maintenance defect using:

- user/reporter name,
- address/location,
- short problem description,
- photograph of the visible defect.

The system must automatically analyze the photograph, identify the **visible** defect, classify it into one of three maintenance categories, route it to that category's dedicated staff queue, calculate priority, and keep the queue ranked as new complaints arrive.

## Required defect → category mapping

| Visible defect | Category |
|---|---|
| `Spalling` | `Structural` |
| `Stagnant Water` | `Functional` |
| `Cracked Tiles` | `Performance` |
| `Paint Peeling` | `Performance` |

Within the **Performance** category, the brief explicitly requires:

```text
Cracked Tiles > Paint Peeling
```

Therefore the priority algorithm must guarantee this ordering, while still using visible severity/extent to rank complaints of the same defect type.

## Required complaint statuses

Only use the required workflow:

```text
Submitted → Assigned → In Progress → Resolved
```

When a complaint becomes `Resolved`:

- it remains visible in the user's complaint history,
- its final resolved status remains visible,
- it is automatically removed from the category's **live staff queue**.

## User portal must allow

- registration/login,
- complaint submission,
- real image upload,
- automatic model result display,
- non-editable defect/category/severity/priority,
- complaint/ticket history,
- current status,
- current queue position,
- staff updates/activity visible without manual re-entry.

## Staff portal must allow

- separate staff login page,
- staff sees **only the category assigned to their account**,
- staff sees a live queue ranked by system priority,
- staff opens a ticket and sees the original image + user description,
- staff progresses the required status state machine,
- staff adds updates/notes,
- updates appear naturally for the user through Realtime.

---

# 2. Evaluation Rubric — Build in This Priority Order

## 2.1 Detection & Classification — 30%

- Correct visible defect identification — **10%**
- Correct Structural / Functional / Performance category — **10%**
- Automatic routing to the correct staff queue — **10%**

## 2.2 Priority Queue Logic — 40% (largest section)

- Correct relative priority based on documented methodology — **15%**
- Correct queue ordering using implemented priority logic — **15%**
- New complaints automatically enter/re-rank the appropriate queue — **10%**

## 2.3 Website Usability & Integration — 20%

- Registering and accessing a complaint — **5%**
- User/staff portal integration — **5%**
- Status tracking — **5%**
- UI/UX design — **5%**

## 2.4 Documentation — 10%

Document all of these:

- Approach — **2%**
- Detection logic — **2%**
- Priority-ranking method — **2%**
- Evaluation results — **2%**
- Limitations — **1%**
- Suggestions for improving accuracy — **1%**

**Engineering implication:** do not spend all four hours making the detector prettier. Priority queue correctness + end-to-end integration carries more marks than detection alone.

---

# 3. Important Competition Constraints

The provided brief requires that:

- the complete system is functional and accessible during evaluation,
- external AI/ML inference services/APIs are not permitted,
- ordinary non-AI infrastructure/services such as authentication, databases, hosting, and libraries are allowed,
- submitted source code, scripts, model weights/checkpoints, dependency files and setup instructions must be self-contained,
- generic publicly available models/backbones pre-trained on general-purpose datasets such as ImageNet/COCO may be used as a starting point,
- checkpoints already trained specifically for defects, stagnant water, or building-damage datasets are not allowed,
- classification must be limited to what is visibly evident in the submitted photograph,
- the visible defect name and category must be generated automatically and shown in both user and staff portals,
- evaluation is performed through the submitted web application,
- post-submission modifications can incur penalties,
- the repository needs to be private until the required deadline and public after it, according to the brief,
- the hosted application link must remain available throughout evaluation.

The brief lists the submission deadline as **3 September, 11:59:59 PM IST** and demonstration/presentation as **4 September, 8 PM IST**.

---

# 4. Existing Uploaded Repo Audit (`bugtracking-master.zip`)

## 4.1 Current stack

The original repo is:

- Next.js `14.2.3`
- React 18
- TypeScript
- Tailwind CSS 3.4
- `bcryptjs`
- `jose`
- `lucide-react`
- `date-fns`
- Google Apps Script web app as the data API
- Google Sheets as Users/BugReports/Comments storage
- custom JWT cookie authentication (`bugtracker_session`)
- Vercel configuration already present

Original `package.json` scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

Original Vercel config selects Mumbai:

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "regions": ["bom1"]
}
```

Keep the India-near deployment idea if it remains supported and place Supabase in the closest compatible region available.

---

## 4.2 Existing repository tree

```text
bugtracking-master/
├── .env.local.example
├── .gitattributes
├── .gitignore
├── README.md
├── google-apps-script/
│   ├── Code.gs
│   └── DEPLOY.md
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── src/
    ├── middleware.ts
    ├── lib/
    │   ├── auth.ts
    │   └── sheets.ts
    ├── components/
    │   ├── layout/
    │   │   └── Sidebar.tsx
    │   └── forms/
    │       ├── AdminUserActions.tsx
    │       ├── CommentThread.tsx
    │       └── StatusUpdater.tsx
    └── app/
        ├── globals.css
        ├── layout.tsx
        ├── page.tsx
        ├── login/page.tsx
        ├── signup/page.tsx
        ├── (app)/
        │   ├── layout.tsx
        │   ├── dashboard/page.tsx
        │   ├── admin/page.tsx
        │   └── bugs/
        │       ├── page.tsx
        │       ├── new/page.tsx
        │       └── [id]/page.tsx
        └── api/
            ├── auth/
            │   ├── login/route.ts
            │   ├── logout/route.ts
            │   ├── me/route.ts
            │   └── signup/route.ts
            ├── admin/users/route.ts
            └── bugs/
                ├── route.ts
                └── [id]/
                    ├── route.ts
                    └── comments/route.ts
```

---

# 5. What the Existing Repo Currently Does

## 5.1 Authentication (`src/lib/auth.ts`)

Current implementation:

- hashes passwords using bcrypt cost 12,
- signs custom JWT using `jose`,
- stores JWT in HTTP-only cookie named `bugtracker_session`,
- session payload is:

```ts
interface SessionPayload {
  userId: string
  username: string
  name: string
  role: 'tester' | 'admin'
}
```

### Replacement

Delete the custom password/JWT ownership and move to:

- Supabase Auth email/password,
- Supabase SSR cookie handling,
- a `profiles` table for `role` and `staff_category`.

`bcryptjs` and `jose` should be removable after migration.

---

## 5.2 Current Google Sheets wrapper (`src/lib/sheets.ts`)

This calls a public Google Apps Script web app using:

```text
GET APPS_SCRIPT_URL?action=...&payload=JSON...
```

It implements:

### Users

- `getAllUsers()`
- `getUserByUsername()`
- `getUserById()`
- `createUser()`
- `updateUserStatus()`

### Bug reports

- `getAllBugs()`
- `getBugById()`
- `getBugsByUser()`
- `createBug()`
- `updateBugStatus()`

### Comments

- `getCommentsByBug()`
- `createComment()`

### Utilities

- `generateBugId()`
- `generateId()`
- `getISTTimestamp()`

### Replacement

Delete this file and create `src/lib/supabase/` clients/helpers plus domain-specific data functions or server actions/routes.

Do not recreate a giant `supabase.ts` god-file. Separate browser/server/admin clients.

---

## 5.3 Google Apps Script backend (`google-apps-script/Code.gs`)

The Apps Script currently:

- has a hardcoded spreadsheet ID placeholder,
- exposes a `doGet()` dispatcher,
- is deployed with public access (`Anyone`),
- creates three sheets: `Users`, `BugReports`, `Comments`,
- reads all rows for many lookups,
- appends records for create operations,
- updates status using sheet row indexes.

This entire folder is obsolete after Supabase migration.

### Delete

```text
google-apps-script/Code.gs
google-apps-script/DEPLOY.md
```

Also delete `APPS_SCRIPT_URL` from environment documentation.

---

## 5.4 Current Users schema

```text
ID
Username
PasswordHash
Role            tester | admin
Status          pending | approved | rejected
CreatedAt
```

### Replace with Supabase Auth + `profiles`

No manual tester-approval workflow is required by the PS. Remove it to save time and reduce complexity.

---

## 5.5 Current BugReports schema

Current fields are designed for software bug tracking:

```text
BugID
ReportedBy
ReporterName
Timestamp
Environment
Module
IssueType
Severity          <-- manually chosen
ExpectedBehaviour
ActualBehaviour
StepsToReproduce
Reproducibility
Screenshots       <-- URL only
ConsoleErrors
AdditionalContext
Status
```

Most of these must be deleted from the domain.

### Replace with complaint fields

```text
Complaint ID
Reporter/User
Reporter Name
Location
Description
Actual image path
Thumbnail path
Detected defect
Category
Confidence
Visible extent
Severity score
Severity label
Priority score
Detections JSON
Status
Model version/hash
Inference latency
Processing latency
Created/updated/resolved timestamps
```

---

## 5.6 Current Comments schema

```text
CommentID
BugID
UserID
UserName
UserRole
Message
Timestamp
```

### Replace conceptually with `ticket_updates`

The existing `CommentThread.tsx` is useful as interaction inspiration, but it should become an **activity timeline** containing:

- system submission event,
- system route/queue event,
- status changes,
- staff notes,
- resolved event.

---

# 6. Existing Pages/Components — Keep, Rewrite or Delete

| Existing file | Action | Reason / replacement |
|---|---|---|
| `src/app/globals.css` | **Rewrite** | Replace neon/dark bug-tracker theme with logo-derived facility theme. |
| `tailwind.config.js` | **Rewrite colors** | Keep Tailwind; replace red/neon design tokens. |
| `src/app/layout.tsx` | **Edit** | Rename metadata to DefectFlow. |
| `src/app/page.tsx` | **Rewrite redirect** | Redirect based on Supabase session/profile role. |
| `src/middleware.ts` | **Rewrite** | Supabase auth/session refresh + role-aware route guards. |
| `src/lib/auth.ts` | **Delete/replace** | Use Supabase Auth helpers. |
| `src/lib/sheets.ts` | **Delete** | Supabase replaces Sheets. |
| `google-apps-script/*` | **Delete** | Supabase replaces backend. |
| `src/app/login/page.tsx` | **Rewrite** | Separate clean user login. |
| `src/app/signup/page.tsx` | **Rewrite** | User registration through Supabase Auth. |
| `src/app/(app)/layout.tsx` | **Rewrite** | New role-aware three-pane workspace shell. |
| `Sidebar.tsx` | **Reuse structure, redesign** | Use logo + Lucide icons + user/staff navigation. |
| `dashboard/page.tsx` | **Rewrite** | User dashboard / staff queue summary. |
| `bugs/page.tsx` | **Replace** | `complaints` / queue list with image thumbnails. |
| `bugs/new/page.tsx` | **Complete rewrite** | Current form has bug-specific fields and manual severity. |
| `bugs/[id]/page.tsx` | **Complete rewrite** | New split submission/activity ticket UI. |
| `CommentThread.tsx` | **Transform** | `TicketActivity.tsx` + staff notes, driven by Realtime. |
| `StatusUpdater.tsx` | **Transform** | Only Submitted → Assigned → In Progress → Resolved. |
| `AdminUserActions.tsx` | **Delete** | No approval panel. |
| `admin/page.tsx` | **Delete/replace** | Staff portal is category queue, not user approval. |
| `/api/auth/*` | **Replace/mostly remove** | Supabase Auth. Keep only helpers/actions if actually needed. |
| `/api/bugs/*` | **Replace** | `/api/complaints`, `/api/analyze`, staff status/update routes. |
| `.env.local.example` | **Rewrite** | Supabase/model variables. |
| `README.md` | **Rewrite** | Setup, model, Supabase, local run, deployment, evaluation. |

---

# 7. Existing UI Behavior That Must Disappear

Current application has:

- product name `Aedura BugTrack`,
- dark black background,
- red neon accent,
- noise overlay,
- tester/admin roles,
- pending approval/rejection,
- software bug modules,
- issue types,
- browser/OS environment,
- manual `Critical / High / Medium / Low` severity selector,
- expected vs actual behavior,
- reproduction steps,
- reproducibility selector,
- screenshot URL rather than file upload,
- console errors,
- statuses `Open → In Progress → Testing → Fixed → Closed`,
- comments polling every 15 seconds.

All of this should be replaced or repurposed.

---

# 8. Fixed Product Decisions

These are already decided. Do not redesign these fundamentals unless technically impossible.

## Product name

```text
DefectFlow
```

Suggested subline:

```text
Photo-Based Facility Maintenance Triage
```

No `Aedura` anywhere in visible UI.

## Backend/data

```text
Supabase Auth + PostgreSQL + Storage + Realtime
```

## Frontend/deployment

```text
Next.js 14 + Tailwind → Vercel
```

## ML runtime

```text
Browser preview: onnxruntime-web
Server authority: onnxruntime-node in Vercel Node runtime
```

## Image submission flow

Use **Option B**:

```text
Client selects image
    ↓
preview + compress + thumbnail
    ↓
client-side ONNX preview
    ↓
user sees non-editable detection/severity
    ↓
Submit multipart/form-data to Next.js API
    ↓
server re-runs ONNX + uploads images to Supabase
    ↓
server computes category/priority + inserts complaint
```

---

# 9. Target Architecture

```text
                         DEFECTFLOW
                              │
                        Next.js / Vercel
                              │
              ┌───────────────┴───────────────┐
              │                               │
          USER PORTAL                     STAFF PORTAL
              │                               │
              └──────────────┬────────────────┘
                             │
                       Supabase Auth
                             │
       ┌─────────────────────┼────────────────────────┐
       │                     │                        │
 browser ONNX preview   Next.js route handlers    Supabase
 onnxruntime-web        on Vercel Node runtime   ┌────┼─────┐
       │                     │                    │    │     │
       │               onnxruntime-node       Postgres Auth Storage
       │                     │                    │
       │               authoritative result       └── Realtime
       │                     │
       └──── UX preview ─────┘
```

The browser output is a convenience. Database values must always come from the authoritative server-side inference result.

---

# 10. Final Repository Structure

Refactor toward this:

```text
defectflow/
├── models/
│   └── defect_detector.onnx
│
├── ml/
│   ├── configs/
│   │   └── defects.yaml
│   ├── scripts/
│   │   ├── validate_dataset.py
│   │   ├── split_dataset.py
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   ├── export_onnx.py
│   │   ├── validate_onnx.py
│   │   ├── quantize_onnx.py        # optional
│   │   └── benchmark.py
│   ├── requirements.txt
│   └── README.md
│
├── scripts/
│   ├── sync-model.ts
│   ├── seed-staff.ts
│   ├── seed-demo.ts
│   ├── reset-demo.ts
│   ├── queue-test.ts
│   ├── smoke-test.ts
│   └── validate-submission.ts
│
├── supabase/
│   └── migrations/
│       ├── 001_types.sql
│       ├── 002_profiles.sql
│       ├── 003_complaints.sql
│       ├── 004_ticket_updates.sql
│       ├── 005_indexes.sql
│       ├── 006_rls.sql
│       ├── 007_storage.sql
│       └── 008_triggers.sql
│
├── public/
│   ├── brand/
│   │   └── logo.png
│   └── models/
│       └── defect_detector.onnx    # generated/synced copy
│
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── user/
│   │   │   ├── dashboard/
│   │   │   └── complaints/
│   │   │       ├── new/
│   │   │       └── [id]/
│   │   ├── staff/
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── queue/
│   │   │   └── complaints/[id]/
│   │   └── api/
│   │       ├── analyze/route.ts
│   │       ├── complaints/route.ts
│   │       ├── complaints/[id]/route.ts
│   │       ├── staff/status/route.ts
│   │       ├── staff/updates/route.ts
│   │       └── health/route.ts
│   │
│   ├── components/
│   │   ├── shell/
│   │   ├── tickets/
│   │   ├── activity/
│   │   ├── inference/
│   │   └── ui/
│   │
│   ├── config/
│   │   └── defects.ts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── browser.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   ├── inference/
│   │   │   ├── browser/
│   │   │   ├── server/
│   │   │   ├── preprocess.ts
│   │   │   ├── postprocess.ts
│   │   │   └── types.ts
│   │   ├── image/
│   │   │   ├── compress.ts
│   │   │   └── validation.ts
│   │   ├── priority/
│   │   │   ├── severity.ts
│   │   │   └── calculate.ts
│   │   └── queue/
│   │       └── rank.ts
│   │
│   ├── types/
│   │   └── domain.ts
│   └── middleware.ts
│
├── .env.local.example
├── README.md
├── package.json
└── vercel.json
```

Do not create folders that remain empty merely to match the diagram. Keep the code compact under the four-hour constraint.

---

# 11. Branding & UI Theme From the Supplied Logo

The attached logo is a muted green/grey construction/facility mark. Use it as the design source.

Approximate palette:

```css
:root {
  --brand-950: #26322c;
  --brand-900: #2f3e39;
  --brand-800: #384b46;
  --brand-700: #455753;
  --brand-600: #54615d;

  --background: #f4f6f5;
  --surface: #ffffff;
  --surface-muted: #eef1ef;
  --border: #d7dcda;

  --text-primary: #1f2925;
  --text-secondary: #66716d;
  --text-muted: #8a938f;
}
```

### Design changes from current repo

Remove:

- noise overlay,
- neon pink/red primary accent,
- glowing effects,
- Unicode nav icons,
- developer/bug-tracker aesthetic.

Use:

- light neutral content workspace,
- deep charcoal-green navigation,
- thin grey-green borders,
- restrained shadows,
- Lucide icons,
- 10–14px rounded cards,
- image-forward ticket rows,
- status/category colors only where they add meaning.

### Logo header

```text
[logo] DefectFlow
       Maintenance Intelligence
```

---

# 12. Main Desktop UI — Three-Pane Ticket Workspace

The main logged-in window should feel like a modern support/maintenance ticket app.

```text
┌──────────────┬──────────────────────┬───────────────────────────────────────────┐
│              │                      │                                           │
│  MAIN MENU   │    TICKET LIST       │              TICKET WORKSPACE             │
│              │                      │                                           │
│  [logo]      │  Search / filter     │  Ticket header                            │
│  DefectFlow  │                      │                                           │
│              │ ┌─────────────────┐  │ ┌────────────────────┬──────────────────┐ │
│  Dashboard   │ │ thumbnail       │  │ │ INITIAL SUBMISSION │ ACTIVITY/UPDATES │ │
│  Complaints  │ │ Cracked Tiles   │  │ │                    │                  │ │
│  New report  │ │ Performance     │  │ │ Photograph         │ Submitted        │ │
│              │ │ Priority 84     │  │ │                    │   ↓              │ │
│              │ │ In Progress     │  │ │ Description        │ Assigned         │ │
│              │ └─────────────────┘  │ │                    │   ↓              │ │
│              │                      │ │ Location           │ In Progress      │ │
│              │ ┌─────────────────┐  │ │                    │                  │ │
│              │ │ thumbnail       │  │ │ AI analysis        │ Staff update     │ │
│              │ │ Spalling        │  │ │                    │                  │ │
│              │ └─────────────────┘  │ └────────────────────┴──────────────────┘ │
└──────────────┴──────────────────────┴───────────────────────────────────────────┘
```

Recommended desktop sizes:

- navigation: ~220–240 px,
- ticket list: ~340–390 px,
- detail workspace: remaining width,
- detail workspace split roughly 55/45 or 60/40 between submission and activity.

On smaller screens, collapse the ticket list/detail into navigable views rather than forcing three tiny columns.

---

# 13. Ticket List Requirements

Each ticket row/card should show a **thumbnail**, not only text.

Example:

```text
┌───────────┬─────────────────────────────┐
│           │ Cracked Tiles               │
│ thumbnail │ Hostel B · Floor 2          │
│           │ Performance                 │
│           │ Medium · Priority 84 · #2   │
│           │ In Progress                 │
└───────────┴─────────────────────────────┘
```

For staff, the ticket list is the category's **priority queue** and must be ordered by `priority_score DESC, created_at ASC`.

For the user, the list can prioritize active/recent complaints and show the current queue position for active complaints.

---

# 14. Ticket Detail Requirements

## Left side — original/immutable submission

Show:

- full complaint image,
- reporter name,
- location/address,
- original description,
- submission timestamp,
- detected defect,
- category,
- visible extent,
- severity,
- priority score,
- optionally confidence.

The ticket's original user description and evidence should not be mutated by routine staff updates.

## Right side — activity/updates

Timeline example:

```text
29 Aug · 7:42 PM
● Complaint submitted

29 Aug · 7:42 PM
● Automatically detected
  Cracked Tiles · Performance · Medium

29 Aug · 7:42 PM
● Routed to Performance queue
  Initial position #3

29 Aug · 8:02 PM
● Assigned
  Maintenance Staff

29 Aug · 8:37 PM
● In Progress
  Inspection started. Replacement tile requested.

30 Aug · 10:14 AM
● Resolved
  Damaged tile replaced.
```

Supabase Realtime should update the right panel automatically when staff changes status or adds a note.

---

# 15. New Complaint Form — User Inputs vs System Outputs

The user only manually enters:

```text
Name
Location / Address
Description
Photograph
```

Everything else is automatic.

### Form concept

```text
Report a Maintenance Defect

┌────────────────────────────┬──────────────────────────────┐
│                            │ Reporter name                │
│    Drop/select photo       │ [________________________]   │
│                            │                              │
│        image preview       │ Location                     │
│                            │ [________________________]   │
│   optional detection box   │                              │
│                            │ Description                  │
│                            │ [________________________]   │
│                            │ [________________________]   │
└────────────────────────────┴──────────────────────────────┘

Automatic analysis
Detected defect     Cracked Tiles
Category            Performance
Visible extent      18.4%
Severity            Medium        🔒
Priority preview    82 / 100       🔒
Confidence          91%

[ Submit Complaint ]
```

`Detected defect`, `Category`, `Severity`, and `Priority` must be visually read-only/non-editable.

Use a lock icon or tooltip such as:

```text
Automatically determined from the submitted photograph.
```

---

# 16. Model During User Input

As soon as the user selects a photograph:

```text
File selected
    ↓
validate type/size
    ↓
create local preview
    ↓
compress / resize
    ↓
preprocess to detector input
    ↓
ONNX Runtime Web inference
    ↓
postprocess detections
    ↓
visible defect + extent + severity + priority preview
    ↓
show result while user is still on the form
```

### Important

The browser result is **not trusted** for persistence.

At submission:

```text
browser preview says X
        ↓
POST image to server
        ↓
server re-runs ONNX
        ↓
server output becomes database truth
```

If browser ONNX initialization fails on an unsupported device, a reasonable fallback is to call a server `/api/analyze` endpoint using the same submitted model, while still never using an external AI inference provider.

---

# 17. Image Handling — Supabase Storage

Do **not** store image binaries directly in PostgreSQL.

Use a private bucket:

```text
complaint-images
```

Storage layout:

```text
complaint-images/
  {user-id}/
    {complaint-id}/
      image.webp
      thumbnail.webp
```

Database stores only paths:

```text
image_path
thumbnail_path
```

### Recommended client transformations

Primary image:

```text
max dimension: 1600 px
target: roughly 1–2 MB
format: WebP where supported
```

Thumbnail:

```text
width: roughly 320–400 px
target: roughly 40–120 KB
```

Keep the final multipart request comfortably below Vercel's function payload limits. Do not send 10–20 MB raw phone images to the route handler.

### Security

- bucket is private,
- access images through short-lived signed URLs or authorized server-generated URLs,
- do not make all complaint evidence public,
- validate MIME type and decoded image,
- strip EXIF/location metadata by re-encoding in the browser,
- reject corrupt/non-image payloads.

### Cleanup

If Storage upload succeeds but database insertion fails, delete the uploaded files to avoid orphaned objects.

---

# 18. Option B Submission Flow — Required

Use this exact conceptual flow:

```text
Browser
  │
  ├── reporter name
  ├── location
  ├── description
  ├── image.webp
  └── thumbnail.webp
        │
        ▼
POST /api/complaints
multipart/form-data
        │
        ▼
Vercel Node function
        │
        ├──────────────────────┐
        │                      │
        ▼                      ▼
server ONNX inference     Supabase Storage upload
        │                      │
        └──────────┬───────────┘
                   ▼
          determine primary defect
                   ▼
            map defect → category
                   ▼
            calculate severity
                   ▼
            calculate priority
                   ▼
            insert complaint row
                   ▼
         insert/system-create event
                   ▼
          calculate current position
                   ▼
             return complaint
```

After the image buffer is available, run independent expensive operations concurrently where safe, e.g. inference and Storage upload via `Promise.all()`.

Do not insert the complaint until the authoritative inference result is ready.

---

# 19. Defect Configuration — One Source of Truth

Create `src/config/defects.ts`:

```ts
export const DEFECTS = {
  spalling: {
    label: 'Spalling',
    category: 'Structural',
  },
  stagnant_water: {
    label: 'Stagnant Water',
    category: 'Functional',
  },
  cracked_tiles: {
    label: 'Cracked Tiles',
    category: 'Performance',
  },
  paint_peeling: {
    label: 'Paint Peeling',
    category: 'Performance',
  },
} as const
```

Never duplicate this mapping in multiple pages/routes.

---

# 20. Severity vs Priority — Keep Them Separate

**Severity** means how visibly extensive/severe the defect appears in the photograph.

**Priority** means where the complaint should sit in its category queue.

A defensible initial visible-severity formula is:

```ts
extentScore = Math.min(visibleExtent / 0.35, 1)
largestRegionScore = Math.min(largestRegion / 0.25, 1)
countScore = Math.min(detectionCount / 4, 1)

severityScore =
  0.70 * extentScore +
  0.20 * largestRegionScore +
  0.10 * countScore
```

Initial severity labels:

```ts
if (severityScore < 0.33) severity = 'Low'
else if (severityScore < 0.66) severity = 'Medium'
else severity = 'High'
```

These thresholds should later be calibrated on the validation dataset and documented.

Do not use model confidence as a primary severity factor: confidence measures model certainty, not physical severity.

---

# 21. Priority Ranking Algorithm

Because the PS explicitly states:

```text
Cracked Tiles > Paint Peeling
```

use non-overlapping score bands for the Performance category.

Initial implementation:

```ts
export function calculatePriority(
  defect: DefectType,
  severityScore: number
) {
  switch (defect) {
    case 'cracked_tiles':
      return 70 + severityScore * 29 // 70–99

    case 'paint_peeling':
      return 40 + severityScore * 29 // 40–69

    case 'spalling':
      return 60 + severityScore * 39 // 60–99

    case 'stagnant_water':
      return 60 + severityScore * 39 // 60–99
  }
}
```

This guarantees:

```text
any cracked-tile complaint > any paint-peeling complaint
```

while severity still ranks tickets within a defect type.

Structural and Functional each have one specified defect, so their internal order is primarily visible severity/extent.

### Queue sorting

```text
priority_score DESC
created_at ASC
```

Timestamp is a deterministic tie-breaker.

### Do not store queue position

Queue position changes whenever a complaint arrives or resolves.

Store `priority_score`, but calculate position dynamically.

Conceptually:

```ts
position = 1 + count(
  active same-category complaints
  that have higher priority OR
  same priority and earlier created_at
)
```

---

# 22. Multiple Visible Defects in One Photo

The evaluator may provide a photograph with more than one supported visible defect.

Store all detector outputs in `detections` JSON, but choose one primary defect for routing.

Suggested selection:

1. group valid detections by class,
2. aggregate visible area per class,
3. calculate class-level severity,
4. use domain risk/order rules to select the primary defect,
5. tie-break by visible extent/confidence,
6. route using the selected primary defect's category.

For Performance, cracked tiles must outrank paint peeling.

The UI may show one primary defect/category and optionally a small `Other visible detections` section if this can be done without confusing the evaluator.

---

# 23. Supabase Database Schema

Use migrations in-repo. The exact SQL can be adjusted for current Supabase/Postgres behavior, but the resulting data model should match this.

## 23.1 Enums

```sql
create type public.user_role as enum ('user', 'staff');

create type public.staff_category as enum (
  'Structural',
  'Functional',
  'Performance'
);

create type public.complaint_status as enum (
  'Submitted',
  'Assigned',
  'In Progress',
  'Resolved'
);

create type public.defect_type as enum (
  'spalling',
  'stagnant_water',
  'cracked_tiles',
  'paint_peeling'
);

create type public.severity_label as enum (
  'Low',
  'Medium',
  'High'
);
```

## 23.2 Profiles

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'user',
  staff_category public.staff_category,
  created_at timestamptz not null default now(),

  constraint profiles_staff_category_check check (
    (role = 'user' and staff_category is null)
    or
    (role = 'staff' and staff_category is not null)
  )
);
```

Normal public signups must always become `user`. Staff role/category is created only by trusted seed/admin code.

## 23.3 Complaints

```sql
create table public.complaints (
  id uuid primary key default gen_random_uuid(),

  reporter_id uuid not null references auth.users(id) on delete cascade,
  reporter_name text not null,
  location text not null,
  description text not null,

  image_path text not null,
  thumbnail_path text not null,

  detected_defect public.defect_type not null,
  category public.staff_category not null,

  confidence real not null check (confidence >= 0 and confidence <= 1),
  visible_extent real not null check (visible_extent >= 0 and visible_extent <= 1),
  largest_region real not null default 0 check (largest_region >= 0 and largest_region <= 1),
  detection_count integer not null default 1 check (detection_count >= 0),

  severity_score real not null check (severity_score >= 0 and severity_score <= 1),
  severity_label public.severity_label not null,
  priority_score real not null,

  detections jsonb not null default '[]'::jsonb,

  status public.complaint_status not null default 'Submitted',
  assigned_staff_id uuid references auth.users(id),

  model_version text not null,
  model_hash text,
  priority_version text not null default 'extent-v1',

  inference_ms integer,
  processing_ms integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
```

## 23.4 Ticket updates

```sql
create table public.ticket_updates (
  id bigint generated always as identity primary key,
  complaint_id uuid not null references public.complaints(id) on delete cascade,

  actor_id uuid references auth.users(id),
  actor_name text,

  type text not null check (type in ('system', 'status', 'staff_note')),
  message text,

  old_status public.complaint_status,
  new_status public.complaint_status,

  created_at timestamptz not null default now()
);
```

### Why keep model metadata

Fields such as:

```text
confidence
visible_extent
model_version
model_hash
priority_version
inference_ms
processing_ms
```

make debugging and final documentation much easier.

---

# 24. Supabase Indexes

At minimum:

```sql
create index complaints_queue_idx
on public.complaints (
  category,
  status,
  priority_score desc,
  created_at asc
);

create index complaints_reporter_idx
on public.complaints (reporter_id, created_at desc);

create index ticket_updates_complaint_idx
on public.ticket_updates (complaint_id, created_at asc);
```

The staff queue should not fetch every complaint and sort in the browser.

---

# 25. Supabase RLS / Security Model

Enable RLS on application tables.

## User may

- read own profile,
- read own complaints,
- read ticket updates belonging to own complaints.

## Staff may

- read own profile,
- read complaints only where `complaints.category = profiles.staff_category`,
- read updates only for complaints in their staff category.

## Browser must NOT be able to directly modify

- `detected_defect`,
- `category`,
- `visible_extent`,
- `severity_score`,
- `severity_label`,
- `priority_score`,
- `model_version`,
- `priority_version`.

Trusted server-side route handlers calculate and write these values.

### Staff mutation security

For fastest safe implementation, a Vercel route handler can:

1. verify the logged-in Supabase user using the SSR/session client,
2. fetch that user's profile,
3. verify `role === 'staff'`,
4. verify the complaint category matches `staff_category`,
5. validate the allowed status transition,
6. then use a server-only Supabase admin/service client to perform the mutation.

Never expose the service-role/secret key to the browser.

---

# 26. Supabase Storage

Create private bucket:

```text
complaint-images
```

The authoritative upload happens server-side in `/api/complaints` using the server-only privileged key after user authentication.

Image display can use short-lived signed URLs generated by authorized server code.

If direct client-side signed uploads are implemented later, maintain strict per-user path policies. Under the four-hour deadline, the Option B server upload is simpler.

---

# 27. Supabase Realtime

Replace `CommentThread.tsx`'s current 15-second polling with Supabase Realtime subscriptions.

### User ticket detail subscribes to

- own complaint row for status changes,
- `ticket_updates` for the open complaint.

### Staff queue subscribes to

- complaints in the staff member's category.

On insert/update/delete/relevant event, refresh or patch local state.

Keep the implementation simple: `router.refresh()` after relevant Realtime events is acceptable for the first competition version if it stays responsive.

---

# 28. Authentication — Supabase

Use Supabase Auth instead of custom JWT/bcrypt.

Preferred fast flow:

## User

```text
/signup
  full name
  email
  password

/login
  email
  password
```

## Staff

```text
/staff/login
  email
  password
```

The staff page uses the same Supabase Auth backend but rejects the session unless the profile has `role = 'staff'`.

Do not expose public staff signup.

### Staff seed accounts

Create `scripts/seed-staff.ts` using the server-only Supabase admin key.

It should create at least:

- Structural staff account,
- Functional staff account,
- Performance staff account.

Their profile rows must have matching `staff_category` values.

For demo convenience, credentials may be loaded from local/Vercel environment variables rather than hard-coded in Git.

---

# 29. Profile Creation

Simplest reliable option:

- signup through Supabase Auth,
- create `profiles` automatically with a Postgres trigger reading `raw_user_meta_data.full_name`,
- always set new public signups to `role='user'` and no staff category.

Staff profiles are updated only by trusted seed/admin logic.

Do not allow `role` to come from an untrusted public signup form.

---

# 30. Required Status State Machine

Server-side validation:

```ts
const STATUS_FLOW = {
  Submitted: ['Assigned'],
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: [],
} as const
```

Do not allow arbitrary jumps or backwards transitions in the primary workflow unless the final documented methodology explicitly supports them.

### Staff UI actions

Instead of a generic dropdown:

```text
Submitted      → [ Assign ]
Assigned       → [ Start work ]
In Progress    → [ Mark resolved ]
Resolved       → terminal
```

When resolved:

- set `resolved_at`,
- remove it from live queue query (`status <> 'Resolved'`),
- insert activity event,
- keep it visible to reporter.

---

# 31. Staff Notes

Allow staff to add a short update in the ticket activity panel:

```text
[ Inspection completed. Replacement tile requested... ]
[ Post update ]
```

This creates a `ticket_updates` row of type `staff_note`.

The user sees it automatically through Realtime.

---

# 32. ONNX Detection Interface

The rest of the web application should not care which detector implementation is used.

Create a shared domain type similar to:

```ts
export type DefectType =
  | 'spalling'
  | 'stagnant_water'
  | 'cracked_tiles'
  | 'paint_peeling'

export interface Detection {
  defect: DefectType
  confidence: number
  box: {
    x: number
    y: number
    width: number
    height: number
  }
  areaRatio: number
}

export interface AnalysisResult {
  detections: Detection[]
  primaryDefect: DefectType
  confidence: number
  visibleExtent: number
  largestRegion: number
  detectionCount: number
  severityScore: number
  severityLabel: 'Low' | 'Medium' | 'High'
  priorityScore: number
}
```

Expose clean functions:

```ts
analyzeImageInBrowser(...): Promise<AnalysisResult>
analyzeImageOnServer(...): Promise<AnalysisResult>
```

Both must use identical preprocessing/postprocessing/math to prevent preview/server disagreement.

---

# 33. Model Session Caching — Latency Critical

Do not create an ONNX session for each image.

Server concept:

```ts
let sessionPromise: Promise<ort.InferenceSession> | null = null

export function getModelSession() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['cpu'],
    })
  }

  return sessionPromise
}
```

Browser:

- preload the ONNX file after login/dashboard becomes idle,
- create one `onnxruntime-web` session,
- reuse it for new complaint images.

This reduces perceived latency substantially.

---

# 34. Model Build Strategy

The problem needs a **four-class object detector**, not only a whole-image classifier, because bounding boxes provide visible extent for priority/severity.

Classes:

```yaml
0: spalling
1: stagnant_water
2: cracked_tiles
3: paint_peeling
```

## Practical competition approach

Use a **small object detector initialized from a generic COCO-pretrained checkpoint/backbone** and fine-tune it on the team's own four-class dataset.

That is consistent with the supplied rule allowing generic pretraining on general-purpose datasets.

### Important distinction about “from scratch”

Build the following yourselves:

- dataset/annotation process,
- class definitions,
- training script/config,
- augmentation choices,
- evaluation,
- final trained checkpoint,
- ONNX export,
- ONNX validation,
- postprocessing,
- integration,
- severity/priority algorithm.

Literal random-weight training is possible but is risky under a four-hour deadline unless a large labeled dataset and GPU are already available.

Never download/use a detector checkpoint already fine-tuned specifically for building defects or these four classes.

---

# 35. Recommended Time-Boxed Training Path

A small YOLO-family detector or another compact COCO-pretrained detector is appropriate because:

- four classes only,
- fast fine-tuning,
- small ONNX export,
- browser/server inference feasible,
- bounding boxes directly support visible extent.

If using Ultralytics, pin the exact version in `ml/requirements.txt` and document/cite it in the final report. Do not use hosted inference.

Example `ml/configs/defects.yaml`:

```yaml
path: ../../dataset
train: images/train
val: images/val
test: images/test

names:
  0: spalling
  1: stagnant_water
  2: cracked_tiles
  3: paint_peeling
```

Example process (adapt to chosen package/version):

```bash
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r ml/requirements.txt

python ml/scripts/validate_dataset.py
python ml/scripts/train.py
python ml/scripts/evaluate.py
python ml/scripts/export_onnx.py
python ml/scripts/validate_onnx.py
python ml/scripts/benchmark.py
```

`train.py` should use your own config and output paths rather than requiring manual GUI steps.

---

# 36. Dataset Splitting — Prevent Leakage

Do not randomly split near-identical photos from the same location/session across train/val/test.

Bad example:

```text
same cracked floor photographed 10 times
8 train / 1 val / 1 test
```

This creates misleadingly high metrics.

Prefer grouping by source/site/session when possible:

```text
location/session groups → exclusive train, val, or test
```

Document the splitting methodology.

---

# 37. ML Pipeline Files

Implement:

```text
ml/scripts/validate_dataset.py
```

Checks:

- all images decode,
- all label files parse,
- class IDs are only 0–3,
- boxes are normalized/valid,
- no empty/corrupt paths,
- useful class-count summary.

```text
ml/scripts/train.py
```

- fixed seed,
- chosen small generic base checkpoint,
- 512-ish input size for speed,
- outputs best checkpoint and training metadata.

```text
ml/scripts/evaluate.py
```

- precision,
- recall,
- mAP,
- per-class metrics,
- confusion information if available.

```text
ml/scripts/export_onnx.py
```

- export final best checkpoint to ONNX,
- fixed expected input shape where useful,
- save to `models/defect_detector.onnx`.

```text
ml/scripts/validate_onnx.py
```

- load a few held-out images,
- compare native framework output vs ONNX output,
- fail if output shapes or detections diverge unexpectedly.

```text
ml/scripts/benchmark.py
```

Record:

- model size,
- model load time,
- first inference,
- warm inference average/p50/p95 where practical,
- preprocessing time.

Do not invent results.

---

# 38. Model Versioning & Synchronization

Authoritative model:

```text
/models/defect_detector.onnx
```

Browser copy:

```text
/public/models/defect_detector.onnx
```

Create `scripts/sync-model.ts` to copy the authoritative model into `public/models/` during `predev` and `prebuild`.

Example package scripts:

```json
{
  "scripts": {
    "model:sync": "tsx scripts/sync-model.ts",
    "predev": "npm run model:sync",
    "prebuild": "npm run model:sync",
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

If the model file does not yet exist during early development, the sync script should fail with a clear message or permit a documented development stub mode; it must not silently deploy without a real final model.

Compute/store a model hash/version in the complaint record when possible.

---

# 39. Browser Preprocessing

Use the exact same normalization/letterboxing semantics as training/export.

Typical steps:

1. decode image,
2. resize/letterbox to model input, e.g. 512×512,
3. convert RGB pixels to float32,
4. normalize to expected range,
5. reshape NHWC/NCHW according to ONNX input,
6. run session,
7. decode predictions,
8. confidence threshold,
9. non-maximum suppression if not included in model graph,
10. map coordinates back to original preview dimensions.

Do not implement a different resize rule in browser and server.

---

# 40. Detection Thresholds

The problem explicitly says to classify what is visibly evident and not claim non-visible/predicted defects.

Therefore:

- define a documented confidence threshold,
- optionally class-specific thresholds after validation,
- if no supported defect exceeds threshold, do **not** invent a class.

Under the required four-class evaluator flow, decide how to handle unsupported/uncertain photos. A safe UX is:

```text
Unable to confidently identify a supported visible defect. Please submit a clearer photograph.
```

This prevents random routing.

---

# 41. Model Latency Measurement

In the server route:

```ts
const requestStart = performance.now()

const inferenceStart = performance.now()
const analysis = await analyzeImageOnServer(buffer)
const inferenceMs = performance.now() - inferenceStart

// upload + DB work

const processingMs = performance.now() - requestStart
```

Store useful rounded values in the complaint row.

The final documentation can then report real measured latency.

---

# 42. Performance / Latency Checklist

Implement these before micro-optimizing anything else:

- client image compression,
- thumbnail rather than original in ticket lists,
- cached browser ONNX session,
- cached server ONNX session,
- preload browser model while dashboard is idle,
- server inference and Storage upload run concurrently where safe,
- database query indexes,
- query only needed columns for lists,
- avoid fetching original full-size image on list pages,
- Realtime refresh only relevant views,
- choose nearby Supabase/Vercel regions,
- use a compact detector/input size,
- avoid unnecessary N+1 signed-URL calls if a batched solution is easy.

---

# 43. New `package.json` Direction

Likely remove after migration:

```text
bcryptjs
@types/bcryptjs
jose
```

Add:

```text
@supabase/supabase-js
@supabase/ssr
onnxruntime-web
onnxruntime-node
tsx
```

Optional only if actually used:

```text
zod
```

Do not add a large component framework during the four-hour build unless necessary. Current Tailwind + Lucide is enough.

---

# 44. Supabase Client Files

Suggested:

## `src/lib/supabase/browser.ts`

- browser/client component Supabase client,
- only public URL + publishable/anon key.

## `src/lib/supabase/server.ts`

- cookie-aware server client for current authenticated user,
- used in Server Components and route handlers for auth identity.

## `src/lib/supabase/admin.ts`

- server-only service role/secret client,
- never import into Client Components,
- used only for trusted writes that must bypass RLS after explicit server authorization.

Protect it with `server-only` if available/appropriate.

---

# 45. Environment Variables

Rewrite `.env.local.example` to something like:

```env
# Public Supabase values
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Server only — NEVER NEXT_PUBLIC
SUPABASE_SERVICE_ROLE_KEY=

# Model
NEXT_PUBLIC_MODEL_URL=/models/defect_detector.onnx
MODEL_PATH=models/defect_detector.onnx
MODEL_VERSION=1.0.0
PRIORITY_VERSION=extent-v1

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DefectFlow

# Optional demo staff seed values
STRUCTURAL_STAFF_EMAIL=
STRUCTURAL_STAFF_PASSWORD=
FUNCTIONAL_STAFF_EMAIL=
FUNCTIONAL_STAFF_PASSWORD=
PERFORMANCE_STAFF_EMAIL=
PERFORMANCE_STAFF_PASSWORD=
```

If current Supabase tooling for the project uses an anon key rather than a publishable key, use the current official naming consistently. The crucial rule is: public key may be browser-exposed; service-role/secret may not.

---

# 46. Middleware / Route Protection

Replace the old middleware logic that checks `bugtracker_session`.

Desired behavior:

- public: `/login`, `/signup`, `/staff/login`, public static/model assets,
- authenticated `user`: `/user/*`,
- authenticated `staff`: `/staff/*`,
- wrong-role navigation redirects to the correct home,
- Supabase session is refreshed correctly for SSR.

Do not rely on middleware role checks alone. Sensitive staff APIs must re-check profile role/category server-side.

---

# 47. User Dashboard

A concise dashboard is enough:

```text
DefectFlow
Good afternoon, <name>

[ Active 3 ] [ Resolved 4 ] [ Total 7 ]

[ + Report a defect ]

Recent complaints
[thumb] Cracked Tiles · Performance · Queue #2 · In Progress
[thumb] Spalling · Structural · Queue #4 · Submitted
```

Do not recreate the current six software-bug stats (`Testing`, `Critical`, etc.).

---

# 48. Staff Dashboard / Queue

A Performance staff member should see only Performance tickets:

```text
Performance Maintenance Queue
8 active complaints
Automatically ranked by visible defect priority

Rank  Image  Defect          Priority  Severity  Extent  Status
#1           Cracked Tiles   94        High      32%     Submitted
#2           Cracked Tiles   82        Medium    19%     Assigned
#3           Cracked Tiles   75        Low       8%      In Progress
#4           Paint Peeling   67        High      31%     Submitted
```

The middle pane can be cards rather than a dense table, but rank/priority must be obvious.

---

# 49. Queue Position Visibility

User should see:

```text
Queue position: #2
```

for active complaints.

Both user and staff should see the **current** ordering/position, not a stale stored field.

When a higher-priority complaint arrives, Realtime should naturally cause ranks to refresh.

---

# 50. Automatic Ticket Lifecycle Events

At minimum create system timeline events for:

- complaint submitted,
- defect detected/category assigned,
- routed to queue,
- status changes,
- staff note,
- resolution.

A database trigger can automatically create status-change events and `resolved_at`, which reduces duplicated JavaScript logic.

Under the four-hour deadline, if triggers become a blocker, explicit server-side insertion in one shared status function is acceptable. Avoid duplicating it in multiple route handlers.

---

# 51. Suggested Supabase Triggers

Useful automation:

1. create `profiles` row after auth signup,
2. maintain `updated_at`,
3. set/unset `resolved_at` based on status,
4. create status activity row on status transitions.

Do not move the ML/priority computation into Postgres; keep it in typed application code for clarity/testability.

---

# 52. Automation Scripts to Add

## `scripts/seed-staff.ts`

Creates/updates the three category staff accounts.

## `scripts/seed-demo.ts`

Creates predictable demo users/tickets if requested. Mark demo records so they can be removed safely.

## `scripts/reset-demo.ts`

Deletes only demo data/images, not real/evaluation data.

## `scripts/queue-test.ts`

Programmatically verifies ranking logic.

Must include at least this deliberately scrambled input:

```text
Performance / Paint Peeling / severe
Performance / Cracked Tiles / mild
Performance / Cracked Tiles / severe
Performance / Paint Peeling / mild
```

Expected order:

```text
1. severe cracked tiles
2. mild cracked tiles
3. severe paint peeling
4. mild paint peeling
```

Also test timestamp tie-breaks and resolved-ticket exclusion.

## `scripts/smoke-test.ts`

As practical, checks:

```text
signup/login
→ create complaint
→ stored category/priority
→ appears in correct queue
→ staff status transitions
→ resolved removed from live queue
```

## `scripts/validate-submission.ts`

Fail if it finds obsolete strings/files such as:

```text
Aedura
BugTrack
Bug Report
APPS_SCRIPT_URL
Google Apps Script
Google Sheets backend
role: 'tester'
role: 'admin'
manual severity selector
Open / Testing / Fixed / Closed workflow
```

Also check:

- model file exists,
- `README.md` exists,
- `.env.local.example` exists,
- required defect labels exist,
- required statuses exist,
- no secret is accidentally committed,
- build command succeeds when possible.

---

# 53. Health Endpoint

Add:

```text
GET /api/health
```

Return a small result such as:

```json
{
  "app": "ok",
  "database": "ok",
  "storage": "ok",
  "model": "loaded"
}
```

Do not leak keys or internal exception details.

This is useful immediately before demo/evaluation.

---

# 54. Duplicate Submission Protection

Prevent double-click/network retry duplicates.

Minimum:

- disable submit once submission begins,
- include a request/client UUID,
- ideally make creation idempotent on that UUID.

Under time pressure, button disabling plus a generated client request ID stored uniquely in DB is sufficient.

---

# 55. Failure Handling

Do not silently create a complaint when analysis fails.

Handle:

- unsupported file type,
- corrupt image,
- image too large,
- no supported defect confidently detected,
- ONNX model failed to load,
- inference failed,
- Storage failed,
- DB failed after Storage succeeded,
- signed URL failed,
- Realtime disconnected.

Show concise recoverable messages.

For a final competition build, never use a random/fallback classification just to make a ticket appear.

---

# 56. README Requirements

Rewrite the root README for the actual competition app.

Include:

1. DefectFlow overview,
2. problem mapping,
3. architecture diagram,
4. supported defects/categories,
5. repository structure,
6. prerequisites,
7. Supabase setup,
8. migrations,
9. environment variables,
10. staff seeding,
11. model dataset format,
12. model training,
13. ONNX export,
14. local development,
15. tests/scripts,
16. Vercel deployment,
17. priority algorithm,
18. model evaluation results (real only),
19. limitations,
20. improvement ideas,
21. competition compliance / external libraries acknowledgement.

---

# 57. Four-Hour Implementation Plan

The exact time may move, but keep the **critical path** intact.

## 0:00–0:15 — Branch, dependency cleanup, start ML job early

- branch from original repo,
- copy logo to `public/brand/logo.png`,
- install Supabase + ONNX packages,
- create target config/types,
- if labeled dataset is ready, start model training immediately so it runs while web refactor happens,
- if model is not ready, keep a strict typed temporary stub behind `detectDefects()` for web development only.

**Checkpoint:** Next app still starts.

## 0:15–0:45 — Supabase foundation

- create Supabase project,
- add schema/migrations,
- create private Storage bucket,
- configure Auth,
- add browser/server/admin clients,
- add profile role model,
- seed three staff accounts,
- delete Google Apps Script usage.

**Checkpoint:** a user can sign up/log in and a staff account can log in with correct role.

## 0:45–1:25 — Complaint creation + images + authoritative backend

- rewrite new complaint form,
- real file input,
- preview/compress/thumbnail,
- create `/api/complaints`,
- run authoritative analysis stub/model,
- upload to Supabase Storage,
- insert complaint,
- return ticket.

**Checkpoint:** one complaint with image is visible in Supabase and user UI.

## 1:25–2:05 — Three-pane UI + staff queue

- redesign sidebar/theme,
- ticket list with thumbnails,
- ticket detail split submission/activity,
- user list/detail,
- staff category queue sorted by priority,
- status state machine,
- staff note UI.

**Checkpoint:** user and staff can see the same ticket from their appropriate views.

## 2:05–2:30 — Realtime + queue position

- subscribe to complaint/status/update changes,
- refresh ticket activity,
- refresh staff queue,
- calculate/display queue position,
- resolved removal.

**Checkpoint:** open user page + staff page; staff update appears to user without manual refresh.

## 2:30–3:10 — Real ONNX integration

- export/obtain team's final locally trained ONNX model,
- implement browser session/pre/post-processing,
- show preview detection/severity before submit,
- implement server ONNX using same preprocessing/postprocessing,
- cache sessions,
- verify browser/server outputs are close,
- store latency/model metadata.

**Checkpoint:** real photo generates real detector output and gets routed automatically.

## 3:10–3:30 — Queue tests + smoke test + cleanup

- run queue tests,
- test each class/category,
- test status transitions,
- test role restrictions,
- test image signed URLs,
- search/remove old terminology,
- run build.

## 3:30–4:00 — Vercel deploy + production smoke test

- push final branch,
- configure Vercel env vars,
- deploy,
- update Supabase Auth Site URL/redirect URLs,
- run staff seed against production,
- open production `/api/health`,
- user submit → staff queue → staff update → user receives update,
- preserve final deployed commit hash.

---

# 58. Reality Check on Building the Model in Four Hours

A **working web application** can realistically be refactored/deployed in four focused hours with an agent if Supabase access and a labeled dataset already exist.

A high-accuracy detector cannot be guaranteed in four hours if:

- no labeled images exist,
- no GPU is available,
- class balance is poor,
- annotations are not ready.

Therefore run model training **in parallel** with the web refactor and use a small generic-pretrained detector as permitted by the rules.

Do not submit the temporary stub. The stub is only to keep frontend/backend development unblocked while the real model trains/exports.

---

# 59. Local Setup — Final Expected Developer Experience

Once refactored, the ideal workflow is:

```bash
# 1. install JS dependencies
npm install

# 2. local env
cp .env.local.example .env.local
# fill Supabase + model variables

# 3. apply Supabase SQL migrations
# fastest: Supabase SQL Editor in order
# or use Supabase CLI if already configured

# 4. create demo staff
npm run seed:staff

# 5. make sure ONNX model exists
ls models/defect_detector.onnx

# 6. sync browser copy
npm run model:sync

# 7. start web app
npm run dev
```

Open:

```text
http://localhost:3000
```

Expected developer commands should be surfaced in `package.json`, ideally:

```text
npm run dev
npm run build
npm run model:sync
npm run seed:staff
npm run demo:seed
npm run demo:reset
npm run test:queue
npm run test:smoke
npm run validate:submission
```

---

# 60. Supabase Setup — Fast Manual Path

For a four-hour build, manual Supabase dashboard setup is acceptable as long as migrations remain in the repo for reproducibility.

1. Create Supabase project.
2. Copy project URL + publishable/anon key.
3. Copy server-only service role/secret key.
4. In SQL Editor, run migrations in filename order.
5. Verify `profiles`, `complaints`, `ticket_updates` tables exist.
6. Verify RLS is enabled.
7. Create private bucket `complaint-images`.
8. Configure Auth email/password.
9. For a fast demo, configure email-confirmation behavior intentionally; do not accidentally require an inbox step nobody prepared for.
10. Put local keys in `.env.local`.
11. Run staff seed script.
12. Test one normal signup and one staff login.

---

# 61. Vercel Deployment — Final Expected Steps

## GitHub flow

```bash
git add .
git commit -m "Refactor BugTrack into DefectFlow"
git push origin defectflow-refactor
```

In Vercel:

1. Import repository/project.
2. Framework: Next.js.
3. Add all environment variables from `.env.local` except anything local-only.
4. Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` prefix.
5. Deploy.
6. Note production URL.
7. In Supabase Auth settings:
   - set Site URL to Vercel production URL,
   - add any required redirect/callback URLs.
8. Run production staff seed if staff accounts are not already in the same Supabase project.
9. Verify the production model file is present and can load.
10. Test `/api/health`.

### Production test

Perform this exact end-to-end test on the deployed URL:

```text
Create user
→ log in
→ choose defect photo
→ browser shows detected defect/category/severity
→ submit
→ complaint image visible
→ detected result saved
→ category queue correct
→ staff logs in
→ ticket visible in correct rank
→ staff assigns
→ user sees update
→ staff starts work
→ user sees update
→ staff resolves
→ complaint disappears from staff live queue
→ user still sees resolved complaint/history
```

---

# 62. Acceptance Tests Mapped to Rubric

## Detection

For each supported class, submit at least a few held-out images and verify:

- visible label correct,
- category correct,
- ticket routed to expected queue.

## Priority

Verify:

- within Performance, every cracked-tile ticket outranks every paint-peeling ticket,
- higher visible severity ranks above lower severity for same defect,
- equal-score tickets use creation time tie-break,
- new high-priority ticket inserts at correct rank immediately,
- resolved ticket disappears from live queue,
- queue position changes for users after reorder.

## Integration

Verify:

- user cannot see other users' complaints,
- Structural staff cannot see Functional/Performance complaints,
- user cannot manually edit AI values,
- staff cannot change category/priority,
- staff cannot skip invalid status transition,
- image URLs are not globally public,
- staff update appears to user through Realtime.

---

# 63. Old-to-New Domain Mapping

| Old BugTrack concept | New DefectFlow concept |
|---|---|
| Bug | Complaint / Ticket |
| Tester | User / Reporter |
| Admin | Staff |
| Admin Panel | Staff Queue |
| Bug ID | Complaint ID / Ticket ID |
| Module | Remove |
| Issue Type | System-detected Defect |
| Environment | Remove |
| Expected Behaviour | Remove |
| Actual Behaviour | Description |
| Steps to Reproduce | Remove |
| Reproducibility | Remove |
| Screenshot URL | Actual uploaded image |
| Console Errors | Remove |
| Additional Context | Fold into Description if needed |
| Manual severity | Automatic non-editable severity |
| Open | Submitted |
| In Progress | In Progress (but after Assigned) |
| Testing | Remove |
| Fixed | Remove |
| Closed | Resolved |
| Comments | Ticket Updates / Staff Notes timeline |
| Sheets User row | Supabase Auth + Profile |
| Sheets BugReport row | `complaints` row |
| Sheets Comments row | `ticket_updates` row |
| 15s polling | Supabase Realtime |

---

# 64. Files / Strings to Search Before Submission

Run repository-wide search for:

```text
Aedura
BugTrack
bugtracker
Bug Report
Bugs
Tester
tester
Admin Panel
role === 'admin'
role === 'tester'
Google Sheets
Google Apps Script
APPS_SCRIPT_URL
bugtracker_session
Critical
Testing
Fixed
Closed
Expected Behaviour
Actual Behaviour
Steps to Reproduce
Reproducibility
Console Errors
Module / Feature
Issue Type
```

Some lowercase technical uses of words like `bug` may exist in unrelated library comments; user-facing/domain uses should be gone.

---

# 65. Final UI Text Suggestions

Use straightforward labels:

### User navigation

```text
Overview
My Complaints
Report Defect
```

### Staff navigation

```text
Queue
Resolved
```

### Ticket automatic analysis

```text
Automatic Analysis
Detected Defect
Category
Visible Extent
Severity
Priority
```

### Activity panel

```text
Activity & Updates
```

Avoid marketing-heavy AI language. The evaluator needs to understand what happened, not be impressed by buzzwords.

---

# 66. Suggested Visual Semantics

Brand/UI should be neutral green/grey. Use category/status accents sparingly.

Possible semantic colors (do not fight the logo palette):

- Structural: muted brick/red accent,
- Functional: muted blue/cyan accent,
- Performance: muted amber accent,
- Submitted: grey/blue,
- Assigned: blue,
- In Progress: amber,
- Resolved: green.

Do not color the whole UI by category.

---

# 67. Documentation Report Content

The final submission documentation should contain these exact concepts.

## Approach

- Next.js/Vercel architecture,
- Supabase Auth/Postgres/Storage/Realtime,
- local ONNX model, browser preview + authoritative server inference,
- deterministic category routing and priority queue.

## Detection logic

- model architecture/base,
- allowed generic pretraining source,
- team's labeled dataset,
- four classes,
- preprocessing,
- confidence/NMS thresholds,
- primary-defect selection,
- ONNX export/validation.

## Priority method

- box visible-area calculation,
- severity formula,
- severity thresholds,
- non-overlapping Performance bands ensuring cracked tiles > paint peeling,
- sorting and tie-breaker,
- queue position is dynamic, not stored.

## Evaluation results

Real values only:

- per-class precision/recall,
- mAP,
- confusion patterns,
- ONNX parity,
- browser/server latency,
- queue test results.

## Limitations

Examples if true:

- lighting/blur/occlusion,
- limited training variety,
- overlapping defect regions,
- close-up images where extent does not equal facility-scale severity,
- browser hardware differences,
- small dataset/class imbalance.

## Improvements

- larger diverse dataset,
- better location/session splits,
- hard-negative mining,
- class-specific confidence thresholds,
- segmentation rather than boxes for more accurate visible area,
- calibration of severity thresholds with facility experts,
- quantization/hardware acceleration after accuracy validation.

---

# 68. High-Value Demo Script

Use two windows/devices.

### Window A — User

1. Sign in.
2. Click `Report Defect`.
3. Select a cracked-tile image.
4. Pause so evaluator sees model automatically show:
   - Cracked Tiles,
   - Performance,
   - non-editable Severity,
   - Priority.
5. Submit.
6. Open resulting ticket.
7. Show image + original description on left, timeline on right.

### Window B — Performance Staff

8. Log in to staff portal.
9. Show complaint automatically appeared in correct priority position.
10. Assign ticket.
11. User window updates.
12. Start work + add note.
13. User window updates.
14. Resolve.
15. Staff live queue loses ticket.
16. User history still shows final resolved state.

### Queue-specific demonstration

Seed or submit:

```text
severe paint peeling
mild cracked tiles
severe cracked tiles
mild paint peeling
```

Show resulting order:

```text
severe cracked tiles
mild cracked tiles
severe paint peeling
mild paint peeling
```

This directly demonstrates the 40% queue section.

---

# 69. Minimal vs Stretch Scope for the Four-Hour Deadline

## Must have before deployment

- Supabase Auth,
- Supabase DB,
- private image Storage,
- user submit form,
- actual uploaded images,
- server ONNX inference,
- detected label/category,
- automatic severity/priority,
- correct category queue,
- staff-only category access,
- required statuses,
- user ticket detail,
- staff ticket detail,
- status/update visibility,
- resolved removal,
- Vercel deployment,
- no Google Sheets/Apps Script dependency.

## Very high priority

- browser ONNX preview during user input,
- Realtime updates,
- three-pane polished UI,
- thumbnails,
- queue tests.

## Stretch only after critical path works

- fancy bounding-box animations,
- model quantization,
- complex charts,
- advanced search/filtering,
- bulk staff actions,
- dark mode,
- email notifications,
- PWA/offline support,
- elaborate admin management UI.

Do not sacrifice core evaluation requirements for stretch features.

---

# 70. Recommended Implementation Definition of Done

Claude should not call the refactor complete until all statements below are true.

- [ ] Product says DefectFlow, not Aedura/BugTrack.
- [ ] Logo is used in navigation/login.
- [ ] Theme matches muted logo palette.
- [ ] Google Apps Script folder is removed from active architecture.
- [ ] `src/lib/sheets.ts` is removed.
- [ ] Custom bcrypt/JWT auth is removed.
- [ ] Supabase Auth works locally.
- [ ] Supabase profiles include role + staff category.
- [ ] Three staff category accounts can be seeded.
- [ ] User can submit name, location, description, photo.
- [ ] Photo is compressed and stored privately in Supabase Storage.
- [ ] Thumbnail appears in ticket list.
- [ ] Browser analysis appears during image entry.
- [ ] Severity/category/priority are non-editable.
- [ ] Server re-runs model on submit.
- [ ] Server result is what gets saved.
- [ ] Correct defect → category mapping is centralized.
- [ ] Staff queue is category restricted.
- [ ] Performance rule `Cracked Tiles > Paint Peeling` is guaranteed.
- [ ] Queue sorted by priority and deterministic timestamp tie-break.
- [ ] Queue position is calculated dynamically.
- [ ] New complaint appears automatically in queue.
- [ ] Staff can only do `Submitted → Assigned → In Progress → Resolved`.
- [ ] Staff can add notes.
- [ ] User sees activity/status updates.
- [ ] Realtime refresh works.
- [ ] Resolved complaints leave live queue.
- [ ] Resolved complaints remain in user history.
- [ ] Model/checkpoint/export scripts exist in repo.
- [ ] ONNX file is in repo/submission where rules require it.
- [ ] Model metrics are real and reproducible.
- [ ] Queue tests pass.
- [ ] `npm run build` passes.
- [ ] `/api/health` works.
- [ ] Vercel production URL passes full smoke test.
- [ ] README explains local run + model + deployment.
- [ ] No secrets committed.
- [ ] Final commit hash recorded before submission freeze.

---

# 71. What the Developer Should Understand After the Refactor

The project should have one simple mental model:

```text
USER PROVIDES FACTS
name + location + description + photograph

SYSTEM PROVIDES INTELLIGENCE
defect + category + extent + severity + priority + queue position

STAFF PROVIDES WORKFLOW
action/status + maintenance updates
```

The major data flow is:

```text
image
→ ONNX detection
→ visible defect
→ category mapping
→ visible severity
→ priority score
→ category queue
→ staff workflow
→ realtime user updates
```

Supabase handles identity/data/storage/realtime. Vercel runs the Next.js application and authoritative inference route. No separate Google Sheet, Apps Script server, custom password database, or external AI inference service remains.

---

# 72. First Commands Claude Should Run on the Original Repo

After extracting the original zip:

```bash
cd bugtracking-master
git checkout -b defectflow-refactor

# inspect baseline
cat package.json
find src -maxdepth 5 -type f | sort

# install/refactor dependencies
npm install @supabase/supabase-js @supabase/ssr onnxruntime-web onnxruntime-node
npm install -D tsx

# after Supabase auth migration, remove if unused
npm uninstall bcryptjs jose @types/bcryptjs
```

Then copy the supplied logo:

```bash
mkdir -p public/brand
# copy attached logo to public/brand/logo.png
```

Do not delete the old backend until Supabase clients/schema exist in the working tree, but remove all runtime references to it before the first final build.

---

# 73. Final Note to Claude

Do not merely generate a plan. **Edit the repository.**

At each major milestone, tell the developer:

1. what was changed,
2. what they need to click/create in Supabase/Vercel,
3. what command to run next,
4. how to verify it worked.

Prioritize a working end-to-end path:

```text
user login
→ upload photo
→ automatic detection
→ automatic severity/priority
→ Supabase complaint + image
→ correct staff queue
→ staff status/update
→ realtime user update
→ resolved removal
```

Once this path works locally, deploy it before spending time on cosmetic extras.

