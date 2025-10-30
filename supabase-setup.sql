-- =====================================================
-- TrafficWatch - Supabase Database Setup
-- =====================================================
-- Run this entire file in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste and Run
-- =====================================================

-- =====================================================
-- 1. CREATE VIOLATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('speeding', 'red_light', 'illegal_parking', 'reckless_driving', 'other')),
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_model TEXT,
  vehicle_color TEXT,
  date_time TIMESTAMPTZ NOT NULL,
  reporter_name TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  reporter_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  evidence_urls TEXT[],
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS violations_user_id_idx ON violations(user_id);
CREATE INDEX IF NOT EXISTS violations_status_idx ON violations(status);
CREATE INDEX IF NOT EXISTS violations_type_idx ON violations(type);
CREATE INDEX IF NOT EXISTS violations_created_at_idx ON violations(created_at DESC);

-- =====================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_violations_updated_at ON violations;

CREATE TRIGGER update_violations_updated_at
  BEFORE UPDATE ON violations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. DROP EXISTING POLICIES (if re-running script)
-- =====================================================

DROP POLICY IF EXISTS "Users can create violations" ON violations;
DROP POLICY IF EXISTS "Users can view own violations" ON violations;
DROP POLICY IF EXISTS "Admins can view all violations" ON violations;
DROP POLICY IF EXISTS "Admins and sub-admins can update violations" ON violations;
DROP POLICY IF EXISTS "Admins can update violations" ON violations;
DROP POLICY IF EXISTS "Admins can delete violations" ON violations;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Policy 1: Users can insert their own violations
CREATE POLICY "Users can create violations"
  ON violations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can view their own violations
CREATE POLICY "Users can view own violations"
  ON violations FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 3: Admins and sub-admins can view all violations
CREATE POLICY "Admins can view all violations"
  ON violations FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sub_admin')
  );

-- Policy 4: Admins and sub-admins can update violations
-- Note: Frontend/API enforces sub-admins can only set pending/under_review
CREATE POLICY "Admins and sub-admins can update violations"
  ON violations FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sub_admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sub_admin')
  );

-- Policy 5: Only admins can delete violations
CREATE POLICY "Admins can delete violations"
  ON violations FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- =====================================================
-- 7. HELPER FUNCTION TO PROMOTE USERS (OPTIONAL)
-- =====================================================

CREATE OR REPLACE FUNCTION promote_user_to_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS void AS $$
BEGIN
  -- Validate role
  IF new_role NOT IN ('user', 'sub_admin', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be user, sub_admin, or admin';
  END IF;

  -- Check if caller is admin
  IF (auth.jwt() -> 'user_metadata' ->> 'role')::text != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Update target user's metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', new_role)
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Check if table was created
SELECT 'violations table created' AS status 
WHERE EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'violations'
);

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE tablename = 'violations';

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS command,
  qual AS using_expression
FROM pg_policies 
WHERE tablename = 'violations'
ORDER BY policyname;

-- =====================================================
-- 9. CREATE STORAGE BUCKETS FOR EVIDENCE FILES
-- =====================================================

-- Create violation-evidence bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('violation-evidence', 'violation-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. STORAGE POLICIES FOR VIOLATION EVIDENCE
-- =====================================================

-- Policy: Users can upload evidence for their own violations
CREATE POLICY "Users can upload violation evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'violation-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own evidence
CREATE POLICY "Users can view own evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'violation-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can view all evidence
CREATE POLICY "Admins can view all evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'violation-evidence' AND
  (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sub_admin')
);

-- Policy: Users can delete their own evidence
CREATE POLICY "Users can delete own evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'violation-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can delete any evidence
CREATE POLICY "Admins can delete any evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'violation-evidence' AND
  (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
);

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Create your first user via the signup page
-- 2. Promote user to admin using Supabase Dashboard:
--    Authentication → Users → Click user → Edit User Metadata
--    Add: {"role": "admin"}
-- 3. Or use SQL to promote:
--    UPDATE auth.users 
--    SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
--    WHERE email = 'your-email@example.com';
-- 4. Storage bucket 'violation-evidence' is created and ready
--    Files will be organized as: {user_id}/{violation_id}/{filename}
-- =====================================================
