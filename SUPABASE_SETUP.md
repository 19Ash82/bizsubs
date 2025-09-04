# Supabase Database Setup Guide

## Quick Setup Steps

### 1. Run the Schema SQL
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy and paste the entire contents of `supabase_schema.sql`
5. Click **"Run"** to execute the schema

### 2. Verify Tables Created
After running the SQL, you should see these tables in your **Table Editor**:
- `users`
- `clients` 
- `projects`
- `subscriptions`
- `lifetime_deals`
- `team_members`
- `activity_logs`
- `user_preferences`

### 3. Test the Onboarding Flow
1. Sign up with a new email address
2. Check your email and click the confirmation link
3. Complete the profile setup (first name, last name)
4. Complete the workspace setup (company name)
5. Access the dashboard

## What the Schema Includes

### Core Tables
- **users**: Extended user profiles with trial/subscription info
- **subscriptions**: Monthly/annual recurring subscriptions
- **lifetime_deals**: One-time purchases with resale tracking
- **clients**: Client management for cost allocation
- **projects**: Project organization within clients

### Security Features
- **Row Level Security (RLS)** enabled on all tables
- **Policies** ensure users only access their own data
- **Foreign key constraints** maintain data integrity
- **Indexes** for optimal query performance

### Business Logic
- **Trial system**: 7-day Business tier trial for new users
- **Multi-currency support**: USD, EUR, GBP, CAD
- **Tax configuration**: Custom tax rates and financial year
- **Activity logging**: Complete audit trail
- **Team collaboration**: Workspace sharing with role-based access

## Troubleshooting

### If you get permission errors:
1. Make sure you're running the SQL as the project owner
2. Check that RLS is enabled in your Supabase project settings

### If tables already exist:
The schema uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times

### If you need to reset:
```sql
-- Only run this if you want to start fresh (will delete all data!)
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.lifetime_deals CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```

## Next Steps
Once the schema is set up:
1. Test the onboarding flow
2. Try creating some sample subscriptions
3. Test the trial system functionality
4. Explore the dashboard features

The database is now ready to support all BizSubs features including subscriptions, client management, team collaboration, and business reporting!
