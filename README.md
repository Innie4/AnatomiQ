# ANATOMIQ

Smarter anatomy. Better recall.

ANATOMIQ is a public Human Anatomy learning and exam-generation platform for the University of Uyo. It ships in a free local-first mode by default: SQLite for data, local filesystem storage for uploaded materials, free local OCR for images, and grounded local question generation when no external AI key is provided.

## Included

- Public topic explorer for Human Anatomy only
- Hidden faculty dashboard at `/upload`
- Upload support for PDF, text notes, and image diagrams
- Local filesystem storage by default
- SQLite database by default
- Semantic chunking and knowledge graph storage
- Grounded MCQ, short answer, and theory generation
- Session-only results with no student persistence
- Public non-personal analytics
- Optional OpenAI enhancement if you later decide to add a key

## Default Free Stack

- Frontend: Next.js 16 App Router, Tailwind CSS 4, Framer Motion
- Backend: Next.js Route Handlers
- Database: SQLite via Prisma
- Storage: local filesystem
- OCR: `pdf-parse` for PDFs and `tesseract.js` for images
- Question generation: local grounded generator by default

## Optional Upgrades

- OpenAI can still be added later for enhanced extraction and question phrasing
- S3 can still be added later for cloud file storage

## Pages

- `/` Home dashboard
- `/topics` Topic explorer
- `/exam` Exam mode
- `/results` Session-only review
- `/upload` Faculty upload dashboard

## APIs

- `GET /api/topics`
- `GET /api/analytics`
- `GET /api/admin-overview`
- `GET /api/material-file/[...key]`
- `POST /api/upload-material`
- `POST /api/process-material`
- `POST /api/generate-questions`
- `POST /api/start-exam`
- `POST /api/grade-mcq`

## Environment

The repo now includes a committed `.env` for the requested local-first setup.

```bash
DATABASE_URL="file:./dev.db"
ADMIN_UPLOAD_KEY="19/BM/ANM/617/2204"
STORAGE_MODE="local"
LOCAL_STORAGE_DIR="storage"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Optional later additions:

```bash
OPENAI_API_KEY="sk-..."
OPENAI_QUESTION_MODEL="gpt-5-mini"
OPENAI_EXTRACTION_MODEL="gpt-5-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create the local database schema

```bash
npm run db:push
```

3. Seed the anatomy taxonomy

```bash
npm run db:seed
```

4. Start development

```bash
npm run dev
```

5. Run verification

```bash
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

- In local mode, uploaded files are written under the configured `storage` directory
- Files are served back through `GET /api/material-file/[...key]`
- If you later set `STORAGE_MODE=s3` with S3 credentials, the same app can switch to bucket storage

## Testing

- `npm test` runs the standard unit suite
- `npm run test:regression` runs regression coverage for local storage safety

## Notes

- Question generation remains grounded in uploaded chunks only
- When no OpenAI key is present, the app still works using local generation and OCR paths
- Scanned image-heavy PDFs are best enhanced later with an external extraction model, but standard PDFs and images work in the free local-first path
