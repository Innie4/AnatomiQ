-- Supabase Storage stores the bucket-level max file size as file_size_limit.
-- 50MB = 52,428,800 bytes.
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'anatomiq-materials'
   OR name = 'anatomiq-materials'
   OR id = 'materials'
   OR name = 'materials';
