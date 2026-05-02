# Vercel Deployment Environment Variables Setup

## Issue
Getting 401 Unauthorized error when trying to access the admin upload console on the deployed site (anatomi-q.vercel.app).

## Root Cause
The `ADMIN_UPLOAD_KEY` environment variable is not set in your Vercel deployment.

## Solution

### Step 1: Go to Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Find and click on your `AnatomiQ` project
3. Click on the "Settings" tab

### Step 2: Add Environment Variables
1. In the Settings page, click on "Environment Variables" in the left sidebar
2. Add the following environment variable:
   - **Key**: `ADMIN_UPLOAD_KEY`
   - **Value**: `19/BM/ANM/617/2204`
   - **Environment**: Select all environments (Production, Preview, Development)
3. Click "Save"

### Step 3: Redeploy
After adding the environment variable, you need to trigger a new deployment for the changes to take effect:
1. Go to the "Deployments" tab
2. Click on the three dots menu on the latest deployment
3. Click "Redeploy"
4. Wait for the deployment to complete

### Step 4: Test
1. Go to https://anatomi-q.vercel.app/upload
2. Enter the admin upload key: `19/BM/ANM/617/2204`
3. Click "Unlock dashboard"
4. You should now see the admin dashboard without any 401 errors

## All Required Environment Variables for Production

Make sure these are all set in Vercel:

```
DATABASE_URL=<your-supabase-pooler-url>
DIRECT_URL=<your-supabase-direct-url>
ADMIN_UPLOAD_KEY=19/BM/ANM/617/2204
STORAGE_MODE=supabase
SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_STORAGE_BUCKET=anatomiq-materials
NEXT_PUBLIC_APP_URL=https://anatomi-q.vercel.app/
OPENAI_API_KEY=<your-openai-key-if-needed>
OPENAI_QUESTION_MODEL=gpt-5-mini
OPENAI_EXTRACTION_MODEL=gpt-5-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

## Security Note
The admin upload key is sensitive. Make sure:
- It's only known to authorized faculty members
- It's never committed to the git repository (already handled via .gitignore)
- Environment variables are only visible to project members in Vercel
