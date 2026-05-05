# ANATOMIQ

Smarter anatomy. Better recall.

ANATOMIQ is a public Human Anatomy learning and exam-generation platform for the University of Uyo. It is now set up for a remote free-tier deployment path by default: Vercel for the app, Supabase Postgres for data, Supabase Storage for uploaded materials, and a grounded in-app question generator when no paid AI provider is configured.

## Included

- Public topic explorer for Human Anatomy only
- Hidden faculty dashboard at `/upload`
- Upload support for PDF, text notes, and image diagrams
- Manual faculty-authored question bank upload tied to a selected material
- Manual question editing, deletion, and numbered bulk import from text/PDF
- Supabase Storage by default
- Supabase Postgres by default
- Semantic chunking and knowledge graph storage
- Grounded MCQ, short answer, and theory generation
- Session-only results with no student persistence
- Public non-personal analytics
- Optional OpenAI enhancement if you later decide to add a key

## Default Remote Free Stack

- Frontend: Next.js 16 App Router, Tailwind CSS 4, Framer Motion
- Full stack runtime: Vercel
- Backend: Next.js Route Handlers
- Database: Supabase Postgres via Prisma
- Storage: Supabase Storage
- OCR: `pdf-parse` for PDFs and `tesseract.js` for images
- Question generation: local grounded generator by default

## Optional Upgrades

- OpenAI can still be added later for enhanced extraction and question phrasing
- S3 can still be wired in later if you ever move off the free-tier default

## Pages

- `/` Home dashboard
- `/topics` Topic explorer
- `/exam` Exam mode
- `/results` Session-only review
- `/upload` Faculty upload dashboard

## APIs

- `GET /api/topics`
- `GET /api/analytics`
- `GET /api/admin-materials`
- `GET /api/admin-overview`
- `GET /api/material-file/[...key]` for optional local-only development mode
- `GET /api/material-questions`
- `PATCH /api/material-questions/[questionId]`
- `DELETE /api/material-questions/[questionId]`
- `POST /api/grade-exam`
- `POST /api/upload-manual-questions`
- `POST /api/material-questions`
- `POST /api/upload-material`
- `POST /api/process-material`
- `POST /api/generate-questions`
- `POST /api/start-exam`
- `POST /api/grade-mcq`

## Environment

The committed `.env` keeps safe local defaults for development, and `.env.example` shows the full remote setup you should copy into Vercel and Supabase.

```bash
DATABASE_URL="postgresql://postgres.your-project-ref:your-password@aws-0-your-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres.your-project-ref:your-password@aws-0-your-region.pooler.supabase.com:5432/postgres?sslmode=require"
ADMIN_UPLOAD_KEY="<YOUR_ADMIN_KEY>"
STORAGE_MODE="supabase"
SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_STORAGE_BUCKET="anatomiq-materials"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Optional later additions:

```bash
OPENAI_API_KEY="sk-..."
OPENAI_QUESTION_MODEL="gpt-5-mini"
OPENAI_EXTRACTION_MODEL="gpt-5-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

## Remote Setup

1. Create a free Supabase project
2. Create a public storage bucket named `anatomiq-materials`
3. Add the values from `.env.example` to Vercel
4. Add the same database and storage values to your local `.env` if you want local admin uploads to hit the remote services too

ANATOMIQ automatically prepares the remote database during `npm run build` when both `DATABASE_URL` and `DIRECT_URL` are present. That step runs Prisma migrations and then seeds the anatomy taxonomy before the Next.js build continues.

## Local Verification

1. Install dependencies

```bash
npm install
```

2. Start development

```bash
npm run dev
```

3. Run verification

```bash
npm run verify:env
npm run lint
npm test
npm run test:regression
npm run build
```

## Topic and Admin Alignment

- The topic explorer now reads from the same live topic coverage source as the upload dashboard.
- Uploaded materials, processing state, question-bank counts, and mapped subtopics stay aligned between both pages.

## Security Model

- No student login
- No student account storage
- No score persistence
- Faculty actions are protected by `ADMIN_UPLOAD_KEY`

## Storage Behavior

- In the default remote mode, uploaded files are written to Supabase Storage and saved with public object URLs
- The optional `GET /api/material-file/[...key]` route remains available only if you explicitly set `STORAGE_MODE=local`
- If you later set `STORAGE_MODE=s3` with S3 credentials, the same app can switch to bucket storage

## Testing

- `npm test` runs the standard unit suite
- `npm run test:regression` runs regression and integration coverage for storage safety, APIs, database behavior, and migrated schema checks
- `npm run verify:env` validates the live Supabase database, storage bucket, app URL, and migration status using the active `.env`

## Notes

- Question generation remains grounded in uploaded chunks only
- When no OpenAI key is present, the app still works using grounded in-app generation and free OCR paths
- Public pages now fall back safely instead of crashing if the remote database is temporarily unreachable during setup
- Manual question banks require an answer and explanation for every question so quizzes can be graded and reviewed immediately
