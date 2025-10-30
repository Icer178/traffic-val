# Admin Panel Documentation

## Overview

The TrafficWatch admin panel provides comprehensive violation management and system oversight for administrators and sub-administrators.

## Access Control

### Role Hierarchy

1. **Admin** (`admin`)
   - Full system access
   - Can view, edit, and delete all violations
   - Can update violation status
   - Can add administrative notes
   - Access to admin dashboard

2. **Sub-Admin** (`sub_admin`)
   - Can view all violations
   - Can edit violations (limited status options)
   - Can update status to pending or under_review
   - Can add admin notes
   - Access to admin dashboard
   - Cannot set resolved or dismissed status
   - Cannot delete violations

3. **User** (`user`)
   - Can only view their own violations
   - Can report new violations
   - No admin panel access

## Features

### 1. Admin Dashboard (`/admin`)

**Access:** Admins and Sub-Admins only

**Features:**
- **Real-time Statistics**
  - Total violations count
  - Pending violations
  - Under review count
  - Resolved violations
  - Dismissed violations
  - Today's new violations
  - Week's activity

- **Status Distribution Chart**
  - Visual progress bars showing percentage of each status
  - Color-coded for easy identification
  - Real-time updates

- **Recent Violations Feed**
  - Last 5 violations
  - Quick status overview
  - Click to view details

- **Quick Actions**
  - Review pending violations
  - View all violations
  - Create new report

### 2. Violation Management (`/violations`)

**Access:** All authenticated users (filtered by role)

**Features:**
- **Advanced Search**
  - Search by plate number
  - Search by location
  - Search by description
  - Real-time filtering

- **Multi-Filter System**
  - Filter by status (pending, under_review, resolved, dismissed)
  - Filter by violation type
  - Combine multiple filters
  - Clear all filters button

- **Violation Cards**
  - Vehicle plate number
  - Status badge
  - Location
  - Date
  - Vehicle model
  - Description preview
  - Evidence count badge

- **Detail Modal**
  - Full violation information
  - Vehicle details
  - Location & time
  - Reporter information
  - Evidence gallery (images/videos)
  - Admin notes (if any)
  - Edit/Delete buttons (admin only)

### 3. Edit Violation (`/violations/[id]/edit`)

**Access:** Admins only

**Features:**
- **Status Management**
  - Update violation status
  - Options: Pending, Under Review, Resolved, Dismissed
  - Required field

- **Admin Notes**
  - Add investigation details
  - Document resolution
  - Internal communication
  - Rich text area

- **Violation Summary**
  - Read-only violation details
  - License plate
  - Type
  - Location
  - Date
  - Description

- **Actions**
  - Save changes
  - Cancel and return
  - Success confirmation

## User Flows

### Admin Workflow

```
1. Sign in → Dashboard
2. View statistics and recent activity
3. Click "Admin Panel" → Admin Dashboard
4. Review pending violations
5. Click violation → View details
6. Click "Edit" → Edit page
7. Update status and add notes
8. Save changes
9. Return to violations list
```

### Sub-Admin Workflow

```
1. Sign in → Dashboard
2. View statistics
3. Click "Admin Panel" → Admin Dashboard
4. View all violations
5. Click violation → View details or Edit
6. Update status (pending/under_review)
7. Add notes for admin review
8. Cannot delete or finalize violations
```

### User Workflow

```
1. Sign in → Dashboard
2. View own violations only
3. Click "Report Violation"
4. Fill form and upload evidence
5. Submit report
6. View in "My Violations"
```

## API Integration

### Endpoints Used

**GET `/api/violations`**
- Fetches violations based on user role
- Users: Only their violations
- Admins/Sub-admins: All violations
- Supports query params: `?status=pending&type=speeding`

**GET `/api/violations/[id]`**
- Fetch single violation
- Permission check based on role
- Returns full violation details

**PATCH `/api/violations/[id]`**
- Update violation (admin only)
- Can update: status, adminNotes
- Users can only update: evidenceUrls (on creation)

**DELETE `/api/violations/[id]`**
- Delete violation (admin only)
- Confirmation required
- Permanent deletion

## Security Features

### Row Level Security (RLS)

**Violations Table:**
```sql
-- Users can only view their own violations
CREATE POLICY "Users can view own violations"
  ON violations FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all violations
CREATE POLICY "Admins can view all violations"
  ON violations FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'sub_admin'));

-- Only admins can update
CREATE POLICY "Admins can update violations"
  ON violations FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

-- Only admins can delete
CREATE POLICY "Admins can delete violations"
  ON violations FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');
```

### Frontend Protection

- Route guards check user role
- Redirect unauthorized users
- Hide admin buttons for non-admins
- Disable edit/delete for sub-admins

### API Protection

- Authentication required on all endpoints
- Role validation in route handlers
- Permission checks before operations
- Error handling for unauthorized access

## UI/UX Features

### Animations
- GSAP animations for stat cards
- Smooth transitions
- Loading states
- Success confirmations

### Responsive Design
- Mobile-friendly layout
- Adaptive grid system
- Touch-friendly buttons
- Collapsible filters

### Visual Feedback
- Color-coded status badges
- Progress bars
- Loading spinners
- Success/error messages
- Hover effects

## Status Workflow

### Violation Lifecycle

```
1. PENDING (Yellow)
   ↓ Admin reviews
2. UNDER_REVIEW (Blue)
   ↓ Investigation complete
3. RESOLVED (Green) or DISMISSED (Gray)
```

### Status Meanings

- **Pending**: New violation, awaiting review
- **Under Review**: Admin is investigating
- **Resolved**: Violation confirmed and action taken
- **Dismissed**: Violation deemed invalid or duplicate

## Best Practices

### For Admins

1. **Review Promptly**
   - Check pending violations daily
   - Prioritize by date
   - Add detailed notes

2. **Status Updates**
   - Move to "Under Review" when investigating
   - Add notes explaining resolution
   - Use "Dismissed" for invalid reports

3. **Communication**
   - Use admin notes for internal tracking
   - Document investigation steps
   - Note any follow-up required

### For Sub-Admins

1. **Triage & Review**
   - Review pending violations
   - Update status to under_review
   - Document findings in notes

2. **Investigation**
   - Verify evidence quality
   - Add context and details
   - Prepare for admin decision

3. **Communication**
   - Use notes to communicate with admins
   - Flag issues or concerns
   - Track trends and patterns

## Troubleshooting

### Common Issues

**Can't access admin panel**
- Check user role in database
- Verify `user_metadata.role` is set
- Sign out and sign in again

**Can't edit violations**
- Ensure you're an admin (not sub-admin)
- Check RLS policies are applied
- Verify API route permissions

**Violations not showing**
- Check RLS policies
- Verify user authentication
- Check API response in console

**Status update fails**
- Ensure admin role
- Check network connection
- Verify API endpoint

## Future Enhancements

- [ ] Bulk status updates
- [ ] Export violations to CSV
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] User management panel
- [ ] Audit log
- [ ] Custom report filters
- [ ] Violation assignment to admins
- [ ] SLA tracking
- [ ] Automated status updates

## File Structure

```
/app/admin/
  └── page.tsx              # Admin dashboard

/app/violations/
  ├── page.tsx              # All violations list
  └── [id]/
      └── edit/
          └── page.tsx      # Edit violation (admin only)

/app/api/violations/
  ├── route.ts              # GET all, POST new
  └── [id]/
      └── route.ts          # GET, PATCH, DELETE single
```

## Testing Checklist

### Admin Role
- [ ] Can access admin dashboard
- [ ] Can view all violations
- [ ] Can edit violation status
- [ ] Can add admin notes
- [ ] Can delete violations
- [ ] Statistics display correctly
- [ ] Recent violations show

### Sub-Admin Role
- [ ] Can access admin dashboard
- [ ] Can view all violations
- [ ] Can edit violations
- [ ] Can update status to pending/under_review
- [ ] Cannot set resolved/dismissed
- [ ] Can add admin notes
- [ ] Cannot delete violations
- [ ] Edit button shown, delete button hidden
- [ ] Statistics display correctly

### User Role
- [ ] Cannot access admin panel
- [ ] Can only see own violations
- [ ] Can create new violations
- [ ] Cannot edit after creation
- [ ] Cannot delete violations

## Support

For issues or questions:
1. Check RLS policies in Supabase
2. Verify user roles in auth.users table
3. Check browser console for errors
4. Review API responses
5. Ensure all migrations are applied
