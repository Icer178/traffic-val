-- =====================================================
-- UPDATE: Allow Sub-Admins to Edit Violations
-- =====================================================
-- This updates the RLS policy to allow sub-admins to update
-- violations. The API enforces that sub-admins can only set
-- status to 'pending' or 'under_review', and can add notes.
-- Only admins can set 'resolved' or 'dismissed' status.
-- =====================================================

-- Drop old policy
DROP POLICY IF EXISTS "Admins can update violations" ON violations;

-- Create new policy allowing both admins and sub-admins
DROP POLICY IF EXISTS "Admins and sub-admins can update violations" ON violations;

CREATE POLICY "Admins and sub-admins can update violations"
  ON violations FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sub_admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sub_admin')
  );

-- Verify the policy was created
SELECT 
  policyname,
  cmd AS command,
  qual AS using_expression
FROM pg_policies 
WHERE tablename = 'violations' AND policyname = 'Admins and sub-admins can update violations';

-- =====================================================
-- DONE!
-- =====================================================
-- Sub-admins can now:
-- ✅ View all violations
-- ✅ Update status (limited to pending/under_review by API)
-- ✅ Add admin notes
-- ❌ Cannot set resolved/dismissed (enforced by API)
-- ❌ Cannot delete violations (RLS policy)
--
-- Admins can:
-- ✅ Everything sub-admins can do
-- ✅ Set any status (pending/under_review/resolved/dismissed)
-- ✅ Delete violations
-- ✅ Manage users
-- =====================================================
