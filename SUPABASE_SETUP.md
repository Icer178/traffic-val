# Supabase Setup Guide - TrafficWatch

This guide will help you set up your Supabase database schema, Row Level Security (RLS) policies, and user roles.

## Table of Contents
1. [Database Schema](#database-schema)
2. [User Roles Setup](#user-roles-setup)
3. [Row Level Security Policies](#row-level-security-policies)
4. [Initial Admin Setup](#initial-admin-setup)

---

## Database Schema

### Violations Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create violations table
CREATE TABLE violations (
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

-- Create index for faster queries
CREATE INDEX violations_user_id_idx ON violations(user_id);
CREATE INDEX violations_status_idx ON violations(status);
CREATE INDEX violations_created_at_idx ON violations(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_violations_updated_at
  BEFORE UPDATE ON violations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## User Roles Setup

### How Roles Work in Supabase

Supabase doesn't have built-in role tables. Instead, we store roles in the user's metadata during signup. There are three roles in TrafficWatch:

- **`user`** - Regular users (can create and view their own violations)
- **`sub_admin`** - Sub-administrators (can view all violations)
- **`admin`** - Full administrators (can view, update, and delete all violations)

### Setting Roles During Signup

Roles are set in the `user_metadata` field when creating a user. This is already implemented in your signup page:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.fullName,
      role: 'user', // Default role
    },
  },
});
```

### Accessing User Roles

In your application code:
```typescript
const { data: { user } } = await supabase.auth.getUser();
const userRole = user?.user_metadata?.role || 'user';
```

In SQL/RLS policies:
```sql
(auth.jwt() -> 'user_metadata' ->> 'role')::text
```

---

## Row Level Security Policies

Enable RLS and create policies for the violations table:

```sql
-- Enable Row Level Security
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

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

-- Policy 4: Only admins can update violations
CREATE POLICY "Admins can update violations"
  ON violations FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Policy 5: Only admins can delete violations
CREATE POLICY "Admins can delete violations"
  ON violations FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );
```

---

## Initial Admin Setup

### Method 1: Manually Update User Metadata (Recommended)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the user you want to make an admin
3. Click on the user
4. Scroll to **User Metadata** section
5. Click **Edit** and add:
```json
{
  "full_name": "Admin Name",
  "role": "admin"
}
```
6. Click **Save**

### Method 2: Using SQL

```sql
-- Update a specific user to admin role
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

### Method 3: Create Admin Signup Function (Advanced)

Create a protected Edge Function or API route that only you can access:

```sql
-- Create a function to promote users (only callable by existing admins)
CREATE OR REPLACE FUNCTION promote_user_to_admin(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if caller is admin
  IF (auth.jwt() -> 'user_metadata' ->> 'role')::text != 'admin' THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  -- Update target user's metadata
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Testing Your Setup

### Test RLS Policies

```sql
-- Test as regular user (should only see own violations)
SELECT * FROM violations;

-- Test role check
SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::text as my_role;
```

### Test in Application

1. **Sign up as regular user** - Should have `user` role
2. **Create a violation** - Should succeed
3. **View violations** - Should only see own violations
4. **Manually promote user to admin** (using Method 1 above)
5. **Refresh session** - Log out and log back in
6. **View violations** - Should now see all violations

---

## Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Troubleshooting

### Users can't see their violations
- Check that RLS is enabled: `ALTER TABLE violations ENABLE ROW LEVEL SECURITY;`
- Verify policies are created correctly
- Check that `user_id` matches `auth.uid()`

### Role not working
- Log out and log back in (JWT needs to refresh)
- Check user metadata in Supabase dashboard
- Verify the role value is exactly `'admin'`, `'sub_admin'`, or `'user'` (case-sensitive)

### Admin can't update/delete
- Verify the user's role in metadata
- Check that the user has logged out and back in after role change
- Test the role query: `SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::text;`

---

## Next Steps

1. Run the database schema SQL
2. Enable RLS and create policies
3. Create your first admin user
4. Test the application with different roles
5. Consider adding more tables (e.g., `comments`, `attachments`, `audit_logs`)
