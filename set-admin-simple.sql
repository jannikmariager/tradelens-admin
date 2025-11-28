-- Set user as admin (run this in Supabase SQL Editor)
UPDATE public.users 
SET role = 'admin' 
WHERE id = '6f29ae71-b4ae-4ded-8cb9-f51cf74c513b';

-- Verify
SELECT id, email, role, created_at 
FROM public.users 
WHERE id = '6f29ae71-b4ae-4ded-8cb9-f51cf74c513b';
