# Quick Setup Guide for Reports Feature

## The Issue
You're getting an "Internal Server Error" when clicking on Reports because the Supabase environment variables are not configured.

## Quick Fix

### 1. Create Environment Variables File
Create a file called `.env.local` in your project root (same level as `package.json`) with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key_here
```

### 2. Get Your Supabase Credentials
1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Paste them into your `.env.local` file

### 3. Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase_schema.sql` from this project
4. Paste and run the SQL to create all necessary tables

### 4. Restart Development Server
```bash
npm run dev
```

## What This Fixes
- ✅ Reports page will load without errors
- ✅ User authentication will work
- ✅ Database queries will function properly
- ✅ All dashboard features will be accessible

## Need Help?
- Check `SUPABASE_SETUP.md` for detailed instructions
- The reports page now shows helpful error messages if setup is incomplete
- All components are ready - just need the database connection!

## After Setup
Once configured, you'll have access to:
- Monthly expense reports
- Tax year summaries
- Client cost allocation
- Category breakdowns
- CSV/PDF export functionality
