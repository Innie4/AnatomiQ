# Upload Endpoint 500 Error - Fix Summary

## Problem
The `/api/upload-material` endpoint was returning 500 Internal Server Error on Vercel deployment.

## Root Cause Analysis
The issue was likely related to one or more of:
1. Prisma schema changes not being properly applied/generated on Vercel
2. Missing or incomplete error logging making it hard to diagnose
3. Potential issues with database operations (upsert, create)

## Changes Implemented

### 1. Prisma Schema Fixes (Commit: 429f125)
- Added `@updatedAt` directive to all `DateTime updatedAt` fields
- Added `@default(uuid())` to all `String id` fields for auto-generation  
- Renamed all Prisma relation fields to use clean camelCase names:
  - Material: `course`, `topic`, `subtopic` (instead of ugly auto-generated names)
  - Topic: `materials`, `questions`, `childTopics`
  - Question, Concept, ContentChunk: similar clean naming
- Updated all query includes and `_count` selects to use new relation names
- Fixed optional field handling in `analyticsCounter.upsert`

### 2. Comprehensive Logging (Commit: 6787d85)
Added detailed console.log statements throughout the upload flow:

**In `/api/upload-material/route.ts`:**
- Log when request starts
- Log authentication success/failure
- Log file details (name, size, type)
- Log each validation step
- Log S3 upload progress
- Log database operations
- Log audit trail creation
- Log completion

**In `src/lib/materials.ts`:**
- Log hierarchy creation (course, topic, subtopic)
- Log each upsert operation
- Log material record creation

### 3. Enhanced Error Handling (Commit: 71ed5bd)
Updated `src/lib/api.ts` to:
- Log full error object and stack trace for all route errors
- Include stack trace in development mode responses
- Provide more context for debugging

## How to Diagnose the Issue

### Step 1: Check Vercel Deployment Logs
1. Go to https://vercel.com/your-project/deployments
2. Click on the latest deployment
3. Go to the "Functions" tab
4. Try uploading a file on the deployed site
5. Immediately check the function logs

### Step 2: Look for These Log Patterns

**If authentication fails:**
```
[upload-material] Starting upload request
[upload-material] Authentication failed
```
→ Check `ADMIN_UPLOAD_KEY` or `JWT_SECRET` environment variables

**If file validation fails:**
```
[upload-material] File received: [name] [size] [type]
[upload-material] File too large: [size]
```
or
```
[upload-material] Unsupported file type: [type]
```
→ Check file size and MIME type

**If S3 upload fails:**
```
[upload-material] Uploading to S3: [key]
[api] Route error: [error details]
```
→ Check S3/Supabase storage credentials

**If database operation fails:**
```
[materials] Ensuring hierarchy: [params]
[materials] Upserting course: [slug]
[api] Route error: [Prisma error]
```
→ Check database connection and Prisma schema

### Step 3: Common Issues and Solutions

#### Issue: "Can't reach database server"
**Solution:** 
- Verify `DATABASE_URL` and `DIRECT_URL` are set in Vercel environment variables
- Check if Supabase database is running
- Verify IP allowlist includes Vercel's IPs

#### Issue: "Prisma Client not initialized"
**Solution:**
- Re-run migrations: `npx prisma migrate deploy` 
- Regenerate client: `npx prisma generate`
- Redeploy to Vercel

#### Issue: "Storage upload failed"
**Solution:**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify storage bucket exists and is accessible
- Check storage bucket permissions

#### Issue: "Invalid default value for 'id'"
**Solution:**
- Ensured with `@default(uuid())` on all id fields (already fixed)
- Regenerate Prisma Client

#### Issue: "Field 'updatedAt' is required"
**Solution:**
- Added `@updatedAt` directive (already fixed)
- Regenerate Prisma Client

## Testing

All tests pass locally:
```bash
npm test  # 64/64 tests passing
npm run build  # Build successful
```

Integration tests specifically verify:
- ✅ Authentication with x-admin-upload-key
- ✅ File upload validation
- ✅ Database operations
- ✅ Storage operations

## Next Steps

1. **Check Vercel Logs** (most important!)
   - The detailed logging will show exactly where the error occurs
   - Copy the full error message and stack trace

2. **If still failing:**
   - Share the Vercel logs
   - I'll provide specific fixes based on the actual error

3. **Once working:**
   - We can remove some of the verbose logging
   - Add production-only error monitoring (Sentry, LogRocket, etc.)

## Files Modified
- `prisma/schema.prisma` - Schema improvements
- `src/app/api/upload-material/route.ts` - Added logging
- `src/lib/materials.ts` - Added logging  
- `src/lib/api.ts` - Enhanced error logging
- `src/lib/admin-overview.ts` - Updated for new relation names
- `src/lib/analytics.ts` - Fixed optional field handling
- `src/lib/questions.ts` - Updated for new relation names
- `src/lib/topic-coverage.ts` - Updated for new relation names

## Verification Checklist
- [x] Build passes locally
- [x] All tests pass (64/64)
- [x] Database operations work locally
- [x] Migrations applied successfully
- [x] Prisma Client regenerated
- [x] Changes pushed to GitHub
- [x] Vercel deployment triggered
- [ ] Upload works on Vercel (pending verification with logs)

---

**Status:** Deployed and ready for testing with comprehensive logging
**Next Action:** Test upload on Vercel and check logs for any remaining issues
