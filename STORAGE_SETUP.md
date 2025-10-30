# Supabase Storage Setup - Evidence Files

## Overview

The TrafficWatch app uses Supabase Storage to store evidence files (images and videos) for violation reports.

## Storage Bucket

**Bucket Name:** `violation-evidence`  
**Public Access:** Yes (files are publicly accessible via URL)  
**File Organization:** `{user_id}/{violation_id}/{timestamp}-{index}.{ext}`

## Setup Instructions

### 1. Run the SQL Setup

The storage bucket and policies are created automatically when you run `supabase-setup.sql`:

```bash
# In Supabase Dashboard → SQL Editor
# Run the entire supabase-setup.sql file
```

### 2. Verify Bucket Creation

Go to **Storage** in your Supabase Dashboard and confirm the `violation-evidence` bucket exists.

## Storage Policies

### Upload Policy
- **Who:** Authenticated users
- **What:** Can upload files to their own folder (`{user_id}/...`)
- **Why:** Users can only add evidence to their own violations

### View Policy (Users)
- **Who:** Authenticated users
- **What:** Can view files in their own folder
- **Why:** Users can see their own evidence

### View Policy (Admins)
- **Who:** Admin and sub-admin users
- **What:** Can view all files in the bucket
- **Why:** Admins need to review all evidence

### Delete Policy (Users)
- **Who:** Authenticated users
- **What:** Can delete files in their own folder
- **Why:** Users can remove evidence from their reports

### Delete Policy (Admins)
- **Who:** Admin users only
- **What:** Can delete any file
- **Why:** Admins can moderate content

## File Constraints

- **Accepted Types:** Images (PNG, JPG, JPEG, GIF, WebP) and Videos (MP4, MOV, AVI)
- **Max File Size:** 50MB per file
- **Multiple Files:** Yes, users can upload multiple evidence files per violation

## How It Works

### 1. User Submits Report
```typescript
// User fills out violation form
// Selects image/video files
```

### 2. Violation Created
```typescript
// POST /api/violations
// Returns violation with ID
```

### 3. Files Uploaded to Storage
```typescript
// Upload each file to: {userId}/{violationId}/{filename}
// Get public URLs for each file
```

### 4. Violation Updated with URLs
```typescript
// PATCH /api/violations/{id}
// Update evidence_urls array with public URLs
```

### 5. Evidence Displayed
```typescript
// Users and admins can view evidence via public URLs
// Images shown in gallery
// Videos playable inline
```

## File URL Format

Public URLs follow this pattern:
```
https://{project-ref}.supabase.co/storage/v1/object/public/violation-evidence/{user_id}/{violation_id}/{filename}
```

Example:
```
https://abc123.supabase.co/storage/v1/object/public/violation-evidence/user-uuid/violation-uuid/1698765432-0.jpg
```

## Security Considerations

1. **File Validation:** Client-side validation checks file type and size
2. **Folder Isolation:** Users can only upload to their own user folder
3. **RLS Policies:** Database-level security prevents unauthorized access
4. **Public URLs:** Files are publicly accessible but URLs are hard to guess
5. **Admin Oversight:** Admins can review and delete inappropriate content

## Troubleshooting

### Files Not Uploading
- Check that the bucket exists in Storage dashboard
- Verify storage policies are created (run SQL setup)
- Check browser console for errors
- Ensure user is authenticated

### Can't View Files
- Verify bucket is set to public
- Check the public URL format is correct
- Ensure RLS policies allow SELECT

### Permission Denied
- Confirm user is authenticated
- Check that file path starts with user's ID
- Verify storage policies match user role

## Database Schema

The `violations` table stores evidence URLs:

```sql
evidence_urls TEXT[]  -- Array of public URLs to uploaded files
```

Example data:
```json
{
  "evidence_urls": [
    "https://project.supabase.co/storage/v1/object/public/violation-evidence/user-123/violation-456/image1.jpg",
    "https://project.supabase.co/storage/v1/object/public/violation-evidence/user-123/violation-456/video1.mp4"
  ]
}
```

## Future Enhancements

- [ ] Image compression before upload
- [ ] Video thumbnail generation
- [ ] Drag-and-drop file upload
- [ ] Direct camera/video capture
- [ ] File size optimization
- [ ] CDN integration for faster delivery
