-- Promote user to admin role
UPDATE users 
SET role = 'admin' 
WHERE id = '6f29ae71-b4ae-4ded-8cb9-f51cf74c513b';

-- Verify the update
SELECT id, email, role, created_at 
FROM users 
WHERE id = '6f29ae71-b4ae-4ded-8cb9-f51cf74c513b';
