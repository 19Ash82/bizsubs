# SubscriptionsTable Component

A comprehensive, feature-rich table component for managing subscriptions with advanced filtering, sorting, bulk operations, and responsive design.

## Features

### ✅ Core Table Features
- **Sortable columns**: Click any column header to sort (Name, Client, Cost, Cycle, Next Payment, Status, Category)
- **Bulk selection**: Select multiple rows with checkboxes, select all functionality
- **Advanced filtering**: Search, status filter, client filter, category filter
- **Responsive design**: Card layout on mobile, table on desktop
- **Empty state**: Beautiful empty state with "Add Subscription" CTA

### ✅ Data Management
- **Real-time data**: Fetches from Supabase subscriptions table with client/project joins
- **RLS compliance**: Respects Row Level Security policies
- **Activity logging**: Tracks all edit operations for team transparency
- **Error handling**: Graceful error states with retry functionality

### ✅ UI/UX Features
- **Status badges**: Colored dots with proper semantic colors (Active=green, Paused=amber, Cancelled=red)
- **Currency formatting**: Proper currency display with symbol support
- **Date formatting**: Human-readable dates with "days until" indicators
- **Violet-600 accents**: Consistent with brand color scheme
- **Loading states**: Skeleton loading for better UX

### ✅ Role-Based Access
- **Admin features**: Edit, delete, bulk operations visible
- **Member features**: View-only mode, no edit buttons shown
- **Permission handling**: Respects user role throughout interface

### ✅ Mobile Responsive
- **Card layout**: Subscriptions shown as cards on mobile
- **Touch-friendly**: Large tap targets and spacing
- **Hidden columns**: Non-essential columns hidden on small screens
- **Optimized scrolling**: Proper mobile scroll behavior

## Usage

### Basic Implementation

```tsx
import { SubscriptionsTable } from '@/components/dashboard';

function MyPage() {
  return (
    <SubscriptionsTable
      userTier="business"
      userRole="admin"
      onEditSubscription={(subscription) => {
        // Handle edit
      }}
      onDeleteSubscription={(id) => {
        // Handle delete
      }}
      onAddSubscription={() => {
        // Handle add new
      }}
    />
  );
}
```

### With Complete Modal Integration

```tsx
import { 
  SubscriptionsTableDemo 
} from '@/components/dashboard';

function SubscriptionsPage() {
  return (
    <SubscriptionsTableDemo
      userTier="business"
      userRole="admin"
      userCurrency="USD"
      userTaxRate={30.0}
    />
  );
}
```

## Props

### SubscriptionsTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userTier` | `string` | `'free'` | User's subscription tier |
| `userRole` | `'admin' \| 'member'` | `'admin'` | User's role for permission control |
| `onEditSubscription` | `(subscription: Subscription) => void` | - | Callback when edit is clicked |
| `onDeleteSubscription` | `(id: string) => void` | - | Callback when delete is clicked |
| `onAddSubscription` | `() => void` | - | Callback when add subscription is clicked |

### Data Structure

The component expects subscriptions with this structure:

```typescript
interface Subscription {
  id: string;
  service_name: string;
  cost: number;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  next_billing_date: string;
  category: string;
  status: 'active' | 'cancelled' | 'paused';
  currency: string;
  client_id?: string;
  project_id?: string;
  business_expense: boolean;
  tax_deductible: boolean;
  notes?: string;
  tax_rate?: number;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    color_hex: string;
  };
  project?: {
    id: string;
    name: string;
  };
}
```

## Column Configuration

### Desktop Table Columns
1. **Checkbox** - Bulk selection
2. **Name** - Service name (sortable)
3. **Client** - Client with color dot (sortable)
4. **Project** - Project name (hidden on mobile)
5. **Category** - Category badge (sortable)
6. **Cost** - Formatted currency (sortable)
7. **Cycle** - Billing cycle badge (sortable)
8. **Next Payment** - Date + days until (sortable)
9. **Status** - Status badge with colored dot (sortable)
10. **Actions** - Edit/delete dropdown (admin only)

### Mobile Card Layout
- Service name + status/cycle badges
- Cost prominently displayed
- Client with color indicator
- Project (if assigned)
- Next payment with countdown
- Category badge
- Actions dropdown (admin only)

## Filtering System

### Search Filter
- Searches across: service name, client name, project name
- Real-time filtering as user types
- Case-insensitive matching

### Status Filter
- All Status (default)
- Active subscriptions
- Paused subscriptions
- Cancelled subscriptions

### Client Filter
- All Clients (default)
- Filter by specific client
- Shows client color indicator in dropdown

### Category Filter
- All Categories (default)
- Filter by subscription category
- Dynamically populated from data

## Sorting System

### Sortable Fields
- `service_name`: Alphabetical
- `cost`: Numerical
- `billing_cycle`: Custom order
- `next_billing_date`: Chronological
- `status`: Active > Paused > Cancelled
- `client_name`: Alphabetical
- `category`: Alphabetical

### Sort Indicators
- Violet chevron icons show current sort
- Click to toggle ascending/descending
- Visual feedback on hover

## Bulk Operations

### Selection Features
- Individual row checkboxes
- "Select all" header checkbox
- Visual feedback for selected rows
- Selected count display

### Bulk Actions Toolbar
- Shows when items are selected
- Edit selected subscriptions
- Delete selected subscriptions
- Clear selection button
- Admin-only visibility

### Bulk Operations Implementation
```typescript
// Example bulk delete
const handleBulkDelete = async (selectedIds: string[]) => {
  const supabase = createClient();
  await supabase
    .from('subscriptions')
    .delete()
    .in('id', selectedIds);
};
```

## Status Badge System

### Status Colors
- **Active**: `bg-emerald-50 text-emerald-700 border-emerald-200` with `bg-emerald-500` dot
- **Paused**: `bg-amber-50 text-amber-700 border-amber-200` with `bg-amber-500` dot
- **Cancelled**: `bg-red-50 text-red-700 border-red-200` with `bg-red-500` dot

### Implementation
```tsx
const StatusBadge = ({ status }) => {
  const config = {
    active: {
      label: 'Active',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500'
    },
    // ... other statuses
  };
  
  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      <div className={cn("w-2 h-2 rounded-full", dotColor)} />
      {label}
    </Badge>
  );
};
```

## Performance Optimizations

### Memoization
- Filtered and sorted data is memoized
- Prevents unnecessary re-calculations
- Updates only when dependencies change

### Efficient Queries
- Single query with joins for client/project data
- Indexed database queries
- Proper RLS policies for security

### Loading States
- Skeleton loading during data fetch
- Individual component loading states
- Error boundaries for graceful failures

## Accessibility Features

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Enter/Space key support for buttons

### Screen Reader Support
- Proper ARIA labels on all controls
- Table headers properly associated
- Status information announced clearly

### Color Contrast
- All text meets WCAG contrast requirements
- Status indicators use both color and text
- Focus indicators clearly visible

## Error Handling

### Error States
- Network error recovery
- Data validation errors
- Permission errors
- Empty state handling

### User Feedback
- Toast notifications for actions
- Inline error messages
- Loading indicators
- Success confirmations

## Integration with Other Components

### EditSubscriptionModal
- Triggered from table actions
- Pre-populated with subscription data
- Validates and updates records
- Logs activity on success

### AddSubscriptionModal
- Triggered from empty state or header
- Creates new subscription records
- Proper form validation
- Activity logging

### Activity Logging
```typescript
// Automatic activity logging on updates
await supabase.from('activity_logs').insert({
  user_id: userData.user.id,
  user_email: userData.user.email,
  action_type: 'update',
  resource_type: 'subscription',
  resource_id: subscription.id,
  description: `Updated subscription: ${formData.service_name}`,
});
```

## Customization

### Theming
- Uses CSS custom properties
- Consistent with shadcn/ui design system
- Violet-600 brand color throughout
- Dark mode support ready

### Column Visibility
- Easy to hide/show columns
- Responsive breakpoint handling
- User preference storage ready

### Custom Actions
- Extensible action dropdown
- Custom bulk operations
- Role-based action visibility
- Event callbacks for integration

## Browser Support

- **Modern browsers**: Full feature support
- **Mobile browsers**: Optimized touch experience
- **Accessibility tools**: Screen reader compatible
- **Progressive enhancement**: Graceful degradation

## Dependencies

- **React 18+**: Hooks and modern features
- **Supabase**: Database and authentication
- **shadcn/ui**: UI component library
- **Lucide React**: Icons
- **class-variance-authority**: Styling utilities
- **Tailwind CSS**: Styling framework

## Future Enhancements

### Planned Features
- [ ] Column reordering
- [ ] Export to CSV/PDF
- [ ] Advanced date filters
- [ ] Subscription templates
- [ ] Bulk import functionality
- [ ] Custom field support
- [ ] Integration with calendar apps
- [ ] Cost trend analytics

### Performance Improvements
- [ ] Virtual scrolling for large datasets
- [ ] Infinite scroll pagination
- [ ] Client-side caching
- [ ] Optimistic updates
- [ ] Background sync

This component provides a production-ready, enterprise-grade subscription management interface that follows all modern best practices for accessibility, performance, and user experience.
