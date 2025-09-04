# BizSubs - Complete Product Requirements

## What We're Building
Business subscription tracker for freelancers and agencies. Track which tools cost what, organize by client/project, export for taxes.

## Target Users
- Freelancers with 10+ business subscriptions
- Small agencies managing client tool costs
- Anyone who needs to organize business expenses for taxes

## Freemium Model & Pricing

### Free Tier
- Track up to 3 total items (subscriptions + lifetime deals combined)
- Basic dashboard overview
- Manual data entry only
- Cloud storage via Supabase

### Business Tier
- **$12.99/month or $129/year** (save $26)
- Currency selection (USD, EUR, GBP, CAD)
- Unlimited subscriptions and lifetime deals
- All business features: client/project organization, tax categorization, team collaboration
- Advanced reporting and exports
- Up to 3 team members
- Priority email support

### Business Premium Tier
- **$24.99/month or $249/year** (save $50)
- Everything in Business tier
- Un to 25 team members
- Priority support with faster response times

### 7-Day Premium Trial
- **New users get 7-day Business tier trial automatically**
- All Business tier features unlocked during trial
- **No credit card required for trial**
- Clear trial countdown in dashboard
- Trial expiration handling with grace period

### Trial-to-Free Transition Logic
**When trial expires:**
- User can **view all existing data** but **cannot add new items** if at/over 2-item limit
- **Cannot edit existing items** if over 2-item limit (read-only mode)
- **Must delete items to get under 2** or upgrade to continue full functionality
- **Clear messaging**: "Your trial has ended. You have X items but can only manage 2 on the free plan."
- **Upgrade prompts**: Persistent but non-intrusive upgrade options throughout app
- **Data preservation**: All data kept, just editing restricted

## Authentication & Access Control

### Magic Link Authentication Flow
- **Step 1: Email Input** - User enters email address on login page
- **Step 2: Magic Link Email** - System sends email with secure authentication link via Supabase
- **Step 3: Email Click** - User clicks link in email, redirected to complete profile setup
- **Step 4: Profile Setup** - New user onboarding flow:
  - First Name (required)
  - Last Name (required) 
  - Save profile → Next step
- **Step 5: Workspace Setup** - Company/Workspace name entry:
  - Company Name (required) - becomes default workspace name
  - Role: Admin (default for new signups)
  - Password (required for account security)
- **Step 6: Dashboard Access** - User gains access to dashboard based on their tier and role

**Member Invitation Flow:**
- **Step 1-3**: Same magic link process
- **Step 4: Profile Setup** - Invited member completes:
  - First Name (required)
  - Last Name (required)
  - Password (required)
  - Role: Member (automatically assigned)
- **Step 5: Join Workspace** - Automatically joins existing workspace, no workspace setup needed

### Account Management & Settings Page
- **Profile Tab**:
  - First Name, Last Name (editable)
  - Email Address (editable with verification)
  - Password change
- **Workspace Tab**:
  - Workspace Name (editable for admins only, read-only for members)
  - Financial Year End Date
  - Tax Rate Configuration  
  - Currency Preference
- **Team Tab** (Admin only):
  - Invite team members by email
  - Manage existing team member roles
  - Remove team members
- **Billing & Subscription Tab** (Admin only):
  - Current plan details
  - Billing history
  - Update payment method
  - Cancel subscription

### Login System
- **Required login** to access dashboard and features
- **Magic Link Authentication** via Supabase Auth
- **Landing page** with signup/login for unauthenticated users
- **Password reset** functionality via email magic link

### Session Management
- Supabase handles automatic session validation
- Secure JWT tokens with automatic refresh
- Session persistence across browser tabs
- Automatic logout after extended inactivity

## Core Features

### 1. Landing Page & Marketing
Hero Section:

Primary headline: "Track Business Subscriptions. Organize Client Costs. Export for Taxes."
Subheadline: "The subscription tracker built for freelancers and agencies who need to organize business expenses and allocate costs to clients."
CTA: "Start 7-Day Free Trial" (no credit card required)
Secondary CTA: "View Demo"

Problem Section:

"Managing business subscriptions across multiple clients is messy"
Pain points: Scattered receipts, unclear client cost allocation, tax season chaos, team members using different tools
Brief, relatable scenarios without dramatic language

Solution Section:

"BizSubs organizes everything in one place"
Core solution pillars: Centralized tracking, client assignment, automated categorization, team collaboration
Visual preview of organized dashboard

Value Proposition (Why Us):

Built specifically for business users (not personal finance)
Client-project cost allocation other tools don't offer
Tax-ready exports with customizable financial year settings
Team collaboration with role-based permissions
Lifetime deal tracking for ROI analysis

Feature Highlights:

Visual previews of dashboard, client filtering, export functionality
Mobile-responsive design showcase
Integration capabilities

Pricing Section:

Clear freemium comparison: Free (2 items) vs Business ($12.99/month)
7-day trial emphasis with "no credit card required"
Annual discount highlighting ($129/year saves $26)

FAQ Section:

Target freelancer/agency concerns about data security, team access, export formats
Trial-to-free transition explanation

### 2. Dashboard Overview

**Layout Structure:**
- **Left Sidebar Navigation**: Fixed navigation menu with BizSubs logo at top
  - Dashboard (current page highlighted)
  - Subscriptions
  - Lifetime Deals
  - Clients
  - Projects  
  - Reports
  - Team (Business/Pro tiers only)
  - Settings
- **Main Content Area**: Central dashboard with responsive grid layout
- **Top Header Bar**: Client filter dropdown, search, user profile, upgrade prompts

**Dashboard Content:**
- **Key Metrics Cards** (4-card grid at top):
  - Total Monthly Recurring: $847.32
  - Annual Business Spend: $9,456
  - Tax Deductible Amount: $7,234
  - This Month's Renewals: $1,203
- **Tier Status Indicator**: Prominent card showing "Free Plan (1/3 items used)" or "Business Trial (3 days left)" or "Business Plan"
- **Trial Countdown**: Highlighted card with remaining trial days and upgrade CTA
- **Client Filter Bar**: Dropdown "All Clients" with search functionality affecting entire dashboard
- **Smart Client Display**: 
  - Single client: "Adobe CC - Client A"
  - Multiple clients: "Adobe CC - Client A +3 more" (click to expand)
- **Upcoming Renewals Widget**: Next 30 days with client context and quick actions
- **Recent Activity Feed**: Team actions, new subscriptions, recent changes
- **Quick Action Buttons**: Add subscription, Add lifetime deal, Export report, Invite team member
- **Post-trial messaging**: Clear explanation when trial expires and user exceeds free limits with upgrade path

### 3. Subscription Management
- **Add subscription details**: name, cost, billing cycle, next payment, client, project
- **Edit existing subscriptions** with full form
- **Mark subscriptions** as active/cancelled/paused
- **Delete subscriptions** with confirmation
- **Billing cycle support**: monthly, annual, quarterly, weekly
- **Business categorization**: tax deductible checkbox, business vs personal
- **Client/project assignment**: dropdown selection with "Add New" option
- **Currency support**: USD, EUR, GBP, CAD per subscription
- **Bulk operations**: select multiple, bulk edit, bulk delete

### 4. Lifetime Deal Tracking
- **Record one-time purchases** with lifetime access
- **Track purchase date and original cost**
- **Resale tracking**: resold price, resold date, automatic profit/loss calculation
- **Business context**: assign to client/project like subscriptions
- **Note key features/limits** of lifetime deals
- **Separate table view** from recurring subscriptions
- **Counts toward item limit** for free tier users
- **Portfolio overview**: total invested, current value, realized/unrealized gains

### 5. Client & Project Organization
- **Simple client list**: name, email, status
- **Project management**: name, associated client, status
- **Client cost tracking**: see total monthly/annual spend per client
- **Project cost allocation**: assign subscriptions to specific projects
- **Color coding**: assign colors to clients/projects for visual organization
- **Client reports**: export costs by client for billing/profitability

### 6. Business Reporting & Tax Features
- **Tax Configuration:**
  - Financial Year End Date: Default Dec 31, customizable dropdown + date picker
  - Tax Rate: Default 30% (US business rate), user-editable with decimals (e.g., 21.6%)
  - Currency preference impacts all calculations
- **Dashboard Reporting:**
  - Client filter dropdown affects entire dashboard view
  - Export buttons change based on filter: "Export All" vs "Export Client A Costs"
  - Filtered views are bookmarkable with URL parameters
- **Monthly expense reports** with business categorization
- **Tax year summary** with total deductible amounts based on custom financial year
- **Client cost allocation reports** for billing transparency
- **Category breakdowns**: Software, Marketing, Design, Infrastructure
- **Export formats**: CSV, PDF for accounting software
- **Custom date ranges** for reporting
- **Automatic tax calculations** using user-defined tax rate

### 7. Team Collaboration
- **Invite team members** by email with automatic role assignment (Member)
- **Two Permission Levels**: 
  - **Admin** (Account owner): Full access to all features, billing, team management
  - **Member** (Invited users): Same views as Admin but no edit/delete buttons visible
- **Team workspace**: shared access to all subscriptions and data
- **Activity logging**: track who made what changes when
- **Member limitations**: Cannot see edit/delete buttons, billing section, or team invite options
- **Simple invite flow**: Admin sends email → Member registers via link → Automatically joins workspace

### Team Settings Structure:
**Admin Settings:**
- Account Details & Profile (First name, Last name)
- WorkSpace : [Company Name]- 
- Financial Year End Date
- Tax Rate Configuration
- Currency Preference
- Team Management (invite/remove members)
- Billing & Subscription Management

**Member Settings:**
- Account Details & Profile
- Workspace: [Company Name] (read-only display)
- Role: Member (read-only display)
- Personal Preferences (notifications, theme)

### 8. Table Management & Organization
- **Show/hide columns**: customize visible columns per user
- **Advanced filtering**: by client, project, category, status, date range
- **Sorting**: click any column header to sort
- **Search functionality**: global search across all fields
- **Bulk selection**: checkboxes for multi-item operations
- **Quick actions menu**: edit, duplicate, delete, assign to client

## Design System & Visual Identity

### Color Palette
**Primary Brand Colors:**
- **Primary**: Violet-600 (#7C3AED) - Main brand color, CTAs, active states
- **Primary Light**: Violet-500 (#8B5CF6) - Hover states, secondary actions 
- **Primary Dark**: Violet-700 (#6D28D9) - Pressed states, dark mode primary

**Semantic Colors:**
- **Success**: Emerald-500 (#10B981) - Active subscriptions, positive metrics, completed actions
- **Warning**: Amber-500 (#F59E0B) - Expiring soon, trial ending, attention needed
- **Danger**: Red-500 (#EF4444) - Overdue payments, errors, destructive actions
- **Info**: Blue-500 (#3B82F6) - Neutral information, links, secondary data

**UI Colors (Dark Theme Primary):**
- **Background**: Slate-950 (#020617) - Main background
- **Surface**: Slate-900 (#0F172A) - Cards, modals, elevated content
- **Border**: Slate-800 (#1E293B) - Dividers, card borders
- **Text Primary**: Slate-50 (#F8FAFC) - Main content text
- **Text Secondary**: Slate-400 (#94A3B8) - Supporting text, labels

**Usage Guidelines:**
- **CTAs and primary actions**: Violet-600 background with white text
- **Dashboard metrics**: Color-coded by status (green=good, amber=warning, red=alert) 
- **Category indicators**: Use violet variations for subscription categories
- **Trial countdown**: Amber gradient when <3 days, red when <1 day

### Typography & Visual Elements
- **Font**: Inter or system fonts (-apple-system, BlinkMacSystemFont)
- **Icons**: Lucide React (consistent with violet theming)
- **Shadows**: Subtle with violet tint for primary elements
- **Gradients**: Violet-to-purple for premium features and upgrade prompts

## Component Patterns
- Use Shadcn/ui components as base, customize with Tailwind
- Create reusable components for subscription cards
- Implement proper loading and error states
- Use React Hook Form with Zod validation
- Modal overlays for forms (not separate pages)

## Performance Requirements

### Core Performance Targets
- **Page Load Time**: Under 2 seconds for initial page load
- **Bundle Size**: Main bundle under 250KB gzipped
- **Mobile Performance**: 90+ Lighthouse score on mobile
- **Database Queries**: Under 100ms for dashboard data loading
- **Real-time Updates**: Sub-500ms for team collaboration updates

### Optimization Standards
- **Code Splitting**: Route-based chunking for optimal loading
- **Image Optimization**: Next.js Image component with WebP format
- **Caching Strategy**: Aggressive caching for static assets, smart caching for dynamic data
- **Bundle Analysis**: Regular bundle size monitoring and optimization
- **Mobile-First**: Responsive design optimized for mobile performance

### Scalability Targets
- **User Capacity**: Handle 10,000+ concurrent users
- **Data Volume**: Support 100+ subscriptions per user efficiently
- **Team Collaboration**: Real-time updates for teams up to 50 members
- **Export Performance**: Generate reports for 1000+ items under 5 seconds

## Technical Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email + optional Google OAuth)
- **Payments**: Stripe integration
- **Deployment**: Netlify

### Cloud-First Database Operations
- All data stored directly in Supabase PostgreSQL
- Immediate persistence on all create/update/delete operations
- Real-time subscriptions for team collaboration using Supabase channels
- Standard React Query/TanStack Query caching for performance optimization

### Caching & Data Loading Strategy
- **React Query/TanStack Query** for intelligent client-side caching
- **Stale-while-revalidate** pattern: Show cached data immediately, fetch fresh data in background
- **Cache duration**: 5 minutes stale time, 30 minutes cache time for subscription data
- **Optimistic updates** for immediate user feedback on actions
- **Background refetching** for data freshness without blocking UI

### Page Refresh & Session Management
- **Authentication persistence**: Supabase handles automatic session management
- **Page refresh flow**: Check auth → Load fresh data from cloud → Apply cached UI preferences
- **New tab handling**: Fresh data load with preserved user preferences
- **Minimal local storage**: Only UI preferences, form drafts, column visibility settings
- **No business data** stored locally - always fetched fresh from Supabase

### Activity Logging System
- Complete audit trail of all user actions stored in activity_logs table
- Track action type, resource type, resource ID, user details, timestamp
- IP address and user agent logging for security
- Real-time activity feed updates for team transparency

### Benefits of Cloud-First Architecture
- Reliable data persistence without sync conflicts
- Real-time collaboration for team features
- Simplified development with standard Supabase patterns
- Automatic backups and data recovery
- Activity logging for audit trails and business accountability
- Always fresh data on page refresh/new tabs
- No manual cache invalidation or sync button complexity

### users
- email, first_name, last_name, company_name, subscription_tier, trial_ends_at, currency_preference, financial_year_end, tax_rate

### subscriptions
- service_name, cost, billing_cycle, next_billing_date, client_name, project_name, category, business_expense, tax_deductible, status, notes, currency, created_at, updated_at

### lifetime_deals
- service_name, original_cost, purchase_date, client_name, project_name, category, business_expense, tax_deductible, resold_price, resold_date, profit_loss (calculated), status, notes, currency

### clients
- name, email, color_hex, status, created_at

### projects  
- name, client_name, description, status, created_at

### team_members
- workspace_owner_id, member_email, role (admin/member), status (pending/active), invited_at, accepted_at

### activity_logs
- user_email, action_type, resource_type, description, timestamp

### user_preferences
- visible_subscription_columns, visible_ltd_columns, default_filters, dashboard_layout

## UI Layout

### Sidebar Navigation
- Dashboard
- Subscriptions
- Lifetime Deals  
- Clients
- Projects
- Reports
- Team (Business tier only)
- Settings

### Main Content Area
- **Tables with customizable columns**
- **Filter bar** at top with dropdowns and search
- **Add/Edit modals** with comprehensive forms
- **Export buttons** with format options
- **Bulk action toolbar** when items selected

### Mobile Responsive
- **Card view** on mobile instead of tables
- **Swipe actions** for quick edit/delete
- **Bottom navigation** for main sections
- **Touch-friendly** buttons and forms

## Payment Integration

### Stripe Integration
- **Secure checkout** for Business tier subscription
- **Customer portal** for self-service billing management  
- **Webhook handling** for subscription status updates
- **Invoice generation** and payment history
- **Proration handling** for upgrades/downgrades
- **Failed payment recovery** with email notifications

### Currency Support
- **Multi-currency pricing**: USD, EUR, GBP, CAD
- **Per-subscription currency** selection
- **Automatic conversion** for reporting totals
- **Currency symbols** displayed correctly throughout app

## Tech Stack
- **Frontend**: Next.js + TypeScript + Tailwind CSS + Shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Deployment**: Netlify
- **Email**: Supabase (transactional emails)

## Development Phases

### Phase 1: Core Foundation (Week 1-2)
- Supabase setup with authentication
- Basic subscription CRUD with business fields
- Dashboard with key metrics
- Free tier limits enforcement (2 items max)
- Trial system implementation

### Phase 2: Business Features (Week 2-3)
- Client and project management
- Lifetime deals tracking with resale
- Advanced filtering and search
- Business categorization and tax features
- Export functionality

### Phase 3: Team & Polish (Week 3-4)
- Team collaboration features
- Activity logging system
- Advanced business reporting
- Stripe payment integration
- Mobile responsive design

### Phase 4: Launch Preparation (Week 4)
- Performance optimization
- User onboarding flow
- Marketing site completion
- Beta testing and feedback integration

## Success Metrics
- **Year 1**: 200 paying users = $31K revenue
- **Year 2**: 800 paying users = $125K revenue  
- **Conversion**: 8-12% trial to paid conversion rate
- **Retention**: 70% at 30 days, 50% at 90 days, 35% at 180 days
- **Usage**: Business users averaging 15+ subscriptions tracked

## File Structure

```
bizsubs/
├── app/                    # Next.js 14 app router
│   ├── (auth)/            # Auth-related pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── subscriptions/ # Subscription management
│   │   ├── lifetime/      # Lifetime deals
│   │   ├── analytics/     # Premium analytics
│   │   └── settings/      # User settings
│   ├── (marketing)/       # Public pages
│   │   ├── page.tsx       # Landing page
│   │   ├── pricing/       # Pricing page
│   │   └── about/
│   └── api/               # API routes
│       ├── auth/          # Auth endpoints
│       ├── stripe/        # Payment webhooks
│       └── sync/          # Data sync endpoints
├── components/            # React components
│   ├── ui/               # Shadcn/ui base components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── subscription/     # Subscription management
│   ├── billing/          # Payment/billing components
│   └── common/           # Shared components
├── lib/                  # Utilities and configurations
│   ├── supabase/         # Supabase client and types
│   ├── stripe/           # Stripe configuration
│   ├── storage/          # Local storage utilities
│   ├── hooks/            # Custom React hooks
│   └── utils.ts          # General utilities
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```