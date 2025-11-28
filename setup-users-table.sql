-- Check if users table exists in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%user%';

-- If no users table, create one with role column
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (true);

-- Create function to auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now set the admin role for your user
UPDATE public.users 
SET role = 'admin' 
WHERE id = '6f29ae71-b4ae-4ded-8cb9-f51cf74c513b';

-- If the user doesn't exist in public.users yet, insert them manually
INSERT INTO public.users (id, email, role)
SELECT 
  id, 
  email, 
  'admin'
FROM auth.users 
WHERE id = '6f29ae71-b4ae-4ded-8cb9-f51cf74c513b'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verify
SELECT u.id, u.email, pu.role 
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
WHERE u.id = '6f29ae71-b4ae-4ded-8cb9-f51cf74c513b';
