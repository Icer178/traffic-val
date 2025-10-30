# Permissions Update - Sub-Admin Enhancement

## Overview

Updated the permission system to give sub-admins more capabilities while maintaining admin control over final decisions.

## Changes Made

### 1. Sub-Admin Permissions (Enhanced)

**Before:**
- ❌ Read-only access
- ❌ Could not edit violations
- ❌ Could not add notes

**After:**
- ✅ Can edit violation status (limited to `pending` and `under_review`)
- ✅ Can add admin notes
- ✅ Can view all violations
- ❌ Cannot set status to `resolved` or `dismissed` (admin only)
- ❌ Cannot delete violations (admin only)

### 2. Admin Permissions (Unchanged - Full Access)

- ✅ View all violations
- ✅ Edit all statuses (pending, under_review, resolved, dismissed)
- ✅ Add/edit admin notes
- ✅ Delete violations
- ✅ Manage users and their roles
- ✅ Full system access

### 3. User Permissions (Unchanged)

- ✅ Report new violations
- ✅ View own violations only
- ✅ Upload evidence
- ❌ Cannot edit after submission
- ❌ Cannot view other users' violations

## Technical Implementation

### Database (RLS Policy)

**Updated Policy:**
```sql
CREATE POLICY "Admins and sub-admins can update violations"
  ON violations FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sub_admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sub_admin')
  );
```

### API Route (`/api/violations/[id]`)

**Permission Logic:**
```typescript
if (userRole === "sub_admin") {
  // Sub-admins can only set pending/under_review
  if (body.status && !["pending", "under_review"].includes(body.status)) {
    return NextResponse.json(
      { error: "Sub-admins can only set status to pending or under_review" },
      { status: 403 }
    );
  }
}

// Sub-admins and admins can update status and notes
if (userRole === "sub_admin" || userRole === "admin") {
  if (body.status) updateData.status = body.status;
  if (body.adminNotes !== undefined) updateData.admin_notes = body.adminNotes;
}
```

### Frontend (`/violations/[id]/edit`)

**Status Dropdown:**
```tsx
<select value={formData.status} ...>
  <option value="pending">Pending</option>
  <option value="under_review">Under Review</option>
  {userRole === "admin" && (
    <>
      <option value="resolved">Resolved</option>
      <option value="dismissed">Dismissed</option>
    </>
  )}
</select>
```

**Helper Text:**
```tsx
{userRole === "sub_admin"
  ? "Sub-admins can only set to Pending or Under Review"
  : "Update the violation status"}
```

## Workflow Examples

### Sub-Admin Workflow

```
1. User reports violation → Status: Pending
2. Sub-admin reviews → Changes to: Under Review
3. Sub-admin investigates → Adds notes for admin
4. Admin reviews notes → Changes to: Resolved/Dismissed
```

### Admin Workflow

```
1. User reports violation → Status: Pending
2. Admin reviews → Can directly set to any status
3. Admin adds notes → Saves final decision
4. Admin can delete if needed
```

## Files Modified

1. **`supabase-setup.sql`**
   - Updated RLS policy to allow sub-admin updates

2. **`src/app/api/violations/[id]/route.ts`**
   - Added sub-admin permission logic
   - Status validation for sub-admins

3. **`src/app/violations/[id]/edit/page.tsx`**
   - Allow sub-admins to access edit page
   - Conditional status options based on role
   - Role-specific helper text

4. **`src/app/violations/page.tsx`**
   - Show edit button for sub-admins
   - Keep delete button for admins only

5. **`src/app/dashboard/page.tsx`**
   - Updated sub-admin permissions display

6. **`src/app/admin/users/page.tsx`** (New)
   - User management page for admins
   - Role reference guide
   - Setup instructions

7. **`src/app/admin/page.tsx`**
   - Added "Manage Users" button for admins

## User Management

### Current Setup

User management requires additional backend setup. For now, use one of these methods:

**Option 1: Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → Authentication → Users
2. Click on a user
3. Update `user_metadata` field
4. Add: `{"role": "admin"}` or `{"role": "sub_admin"}`
5. Save

**Option 2: SQL Function**
```sql
-- Already in supabase-setup.sql
SELECT promote_user_to_role(
  'user-uuid-here'::uuid,
  'sub_admin'
);
```

**Option 3: Create API Route**
- Create `/api/admin/users/[id]/role`
- Use Supabase Admin API
- Requires service role key

## Security Layers

### 1. Database Level (RLS)
- Sub-admins can UPDATE violations table
- Only admins can DELETE

### 2. API Level
- Validates role from JWT
- Checks status values for sub-admins
- Returns 403 for unauthorized actions

### 3. Frontend Level
- Hides unavailable options
- Shows role-appropriate UI
- Displays helpful messages

## Testing Checklist

### Sub-Admin Role
- [x] Can access edit page
- [x] Can see pending/under_review options
- [x] Cannot see resolved/dismissed options
- [x] Can add admin notes
- [x] Can save changes
- [x] Cannot delete violations
- [x] Edit button shows on violations list
- [x] Delete button hidden

### Admin Role
- [x] Can access edit page
- [x] Can see all status options
- [x] Can add admin notes
- [x] Can save changes
- [x] Can delete violations
- [x] Can access user management
- [x] Both edit and delete buttons show

### API Validation
- [x] Sub-admin setting "resolved" → 403 error
- [x] Sub-admin setting "dismissed" → 403 error
- [x] Sub-admin setting "pending" → Success
- [x] Sub-admin setting "under_review" → Success
- [x] Admin setting any status → Success

## Migration Steps

1. **Update Database:**
   ```bash
   # Run in Supabase SQL Editor
   # Use: update-subadmin-permissions.sql
   ```

2. **Deploy Code:**
   - All frontend changes are already in place
   - API routes updated
   - No breaking changes

3. **Test:**
   - Sign in as sub-admin
   - Try editing a violation
   - Verify status restrictions
   - Test note adding

4. **Verify:**
   - Check RLS policies in Supabase
   - Test API endpoints
   - Confirm UI shows correct options

## Benefits

### For Sub-Admins
- ✅ More autonomy in workflow
- ✅ Can triage violations
- ✅ Can document findings
- ✅ Reduces admin workload

### For Admins
- ✅ Focus on final decisions
- ✅ Review sub-admin notes
- ✅ Less routine work
- ✅ Better delegation

### For System
- ✅ Clear separation of duties
- ✅ Better audit trail
- ✅ Scalable workflow
- ✅ Maintains security

## Future Enhancements

- [ ] User management API
- [ ] Role change history/audit log
- [ ] Email notifications on status change
- [ ] Bulk status updates
- [ ] Assignment system (assign violations to sub-admins)
- [ ] Performance metrics per sub-admin
- [ ] Approval workflow (sub-admin proposes, admin approves)

## Support

If sub-admins cannot edit violations:
1. Check RLS policy is applied: Run `update-subadmin-permissions.sql`
2. Verify user role in database: Check `auth.users.raw_user_meta_data`
3. Test API directly: Use browser dev tools
4. Check for errors in console

If status restrictions not working:
1. Verify API route changes are deployed
2. Check frontend shows correct options
3. Test with network inspector
4. Verify JWT contains correct role
