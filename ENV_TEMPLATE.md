# Environment Variables Template

Create a `.env.local` file in the root of your project with these variables:

```env
# Supabase Configuration
# Get these from your Supabase project dashboard → Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## How to Get Your Keys

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon/public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Important Notes

- ⚠️ Never commit `.env.local` to version control (it's already in `.gitignore`)
- ⚠️ Use the **anon/public** key, NOT the service role key
- ⚠️ The `NEXT_PUBLIC_` prefix makes these variables available in the browser
- ✅ Restart your dev server after creating/updating `.env.local`

## Quick Setup

```bash
# Create the file
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EOF

# Restart dev server
pnpm dev
```

## Verification

After setting up, you should be able to:
1. Visit `http://localhost:3000`
2. See the sign-in page
3. Sign in with a Supabase user account
4. Access the dashboard

If you see errors, check:
- ✅ `.env.local` file exists in project root
- ✅ Keys are correct (no extra spaces)
- ✅ Dev server was restarted
- ✅ Supabase project is active
