# Security Improvements - Upload Before Create

## Overview

Refactored the violation submission flow to upload evidence files **before** creating the violation record, eliminating the need for users to update violations after creation.

## Previous Flow (Less Secure)

```
1. Create violation → Get ID
2. Upload files to storage
3. Update violation with evidence URLs ❌ (requires UPDATE permission)
```

**Security Issue:** Users needed UPDATE permission on violations table, which could potentially be exploited.

## New Flow (More Secure)

```
1. Upload files to storage (with temporary ID)
2. Get evidence URLs
3. Create violation with URLs included ✅ (only INSERT permission needed)
```

**Security Benefit:** Users only need INSERT permission. No UPDATE permission required = tighter security.

## Changes Made

### 1. Frontend (`/src/app/report/page.tsx`)

**Before:**
```typescript
// Create violation first
const response = await fetch("/api/violations", { method: "POST", ... });
const violation = await response.json();

// Then upload and update
if (uploadedFiles.length > 0) {
  const urls = await uploadFilesToStorage(violation.id);
  await fetch(`/api/violations/${violation.id}`, { 
    method: "PATCH",  // ❌ Requires UPDATE permission
    body: JSON.stringify({ evidence_urls: urls })
  });
}
```

**After:**
```typescript
// Upload files FIRST
let evidenceUrls: string[] = [];
if (uploadedFiles.length > 0) {
  const tempId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  evidenceUrls = await uploadFilesToStorage(tempId);
}

// Then create violation with URLs included
const response = await fetch("/api/violations", {
  method: "POST",  // ✅ Only INSERT permission needed
  body: JSON.stringify({ ...formData, evidenceUrls })
});
```

### 2. Types (`/src/types/index.ts`)

Added `evidenceUrls` to `CreateViolationInput`:

```typescript
export interface CreateViolationInput {
  // ... other fields
  evidenceUrls?: string[];  // ✅ Now included at creation
}
```

### 3. API Route (`/src/app/api/violations/route.ts`)

Updated POST handler to accept `evidenceUrls`:

```typescript
const violationData = {
  // ... other fields
  evidence_urls: body.evidenceUrls || null,  // ✅ Stored at creation
  status: "pending",
};
```

### 4. Database Policies (`supabase-setup.sql`)

**No changes needed!** The existing policies are already secure:

```sql
-- ✅ Users can INSERT (create violations)
CREATE POLICY "Users can create violations"
  ON violations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ✅ Only admins can UPDATE
CREATE POLICY "Admins can update violations"
  ON violations FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');
```

## Storage Structure

Files are organized using a temporary ID:

```
violation-evidence/
  └── {user-id}/
      └── {timestamp}-{random}/
          ├── 1698765432-0.jpg
          └── 1698765432-1.mp4
```

The temporary ID format: `{timestamp}-{random}` ensures uniqueness without needing the database violation ID.

## Security Benefits

1. **✅ No UPDATE permission for users** - Users can only create, not modify
2. **✅ Immutable violations** - Once created, users cannot change their reports
3. **✅ Admin-only modifications** - Only admins can update violation status, notes, etc.
4. **✅ Audit trail** - All changes must be made by admins, improving accountability
5. **✅ Simpler RLS policies** - Fewer policies = less attack surface

## Testing Checklist

- [ ] User can create violation without evidence
- [ ] User can create violation with images
- [ ] User can create violation with videos
- [ ] User can create violation with mixed media
- [ ] Evidence URLs are stored correctly in database
- [ ] Files are accessible via public URLs
- [ ] User cannot update their own violations
- [ ] Admin can update any violation
- [ ] Storage folder structure is correct

## Migration Notes

If you already have violations without evidence URLs, admins can still add them later using the UPDATE permission.

## Rollback

If you need to revert to the old flow:
1. Add user update policy back to `supabase-setup.sql`
2. Revert changes to `report/page.tsx` (create first, then upload)
3. Remove `evidenceUrls` from `CreateViolationInput`

However, the new flow is recommended for better security.
