# Add Subscription Modal Component

## Overview
The `AddSubscriptionModal` component provides a comprehensive form for adding new business subscriptions to the BizSubs dashboard. It includes form validation, free tier limit checking, and Supabase integration.

## Features

### Form Fields
- **Service Name** (required) - Text input for subscription service
- **Cost** (required) - Number input with currency symbol
- **Billing Cycle** (required) - Dropdown: Weekly/Monthly/Quarterly/Annual
- **Next Billing Date** (required) - Date picker with future date validation
- **Client** (optional) - Dropdown with existing clients + "Add New Client" option
- **Project** (optional) - Dropdown filtered by selected client's projects only
- **Category** (required) - Dropdown: Software/Marketing/Design/Infrastructure/Other
- **Business Expense** (checkbox) - Default checked
- **Tax Deductible** (checkbox) - Default checked
- **Currency** (required) - Dropdown: USD/EUR/GBP/CAD, defaults to user preference
- **Status** (required) - Dropdown: Active/Cancelled/Paused, default Active
- **Notes** (optional) - Textarea for additional information

### Validation
- React Hook Form with Zod schema validation
- Required field validation with clear error messages
- Cost must be positive number (minimum $0.01)
- Date must be today or in the future
- Form submission disabled until all validations pass

### Free Tier Management
- Checks current subscription count against free tier limit (3 items)
- Shows warning when approaching limit (2/3 items)
- Blocks submission with upgrade prompt if limit exceeded
- Provides clear messaging about plan limitations

### Technical Features
- TypeScript with proper interfaces
- Supabase integration for data persistence
- Activity logging for audit trail
- Toast notifications for success/error feedback
- Form reset after successful submission
- Mobile responsive layout
- Loading states and error handling

## Usage

### Basic Usage
```tsx
import { AddSubscriptionModal } from "@/components/dashboard";

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Add Subscription
      </button>
      
      <AddSubscriptionModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={() => {
          // Refresh data or handle success
          console.log('Subscription added successfully');
        }}
        userTier="free" // or "business", "business_premium"
        userCurrency="USD" // or "EUR", "GBP", "CAD"
      />
    </>
  );
}
```

### With Button Component
```tsx
import { AddSubscriptionButton } from "@/components/dashboard";

function MyComponent() {
  return (
    <AddSubscriptionButton
      onSuccess={() => {
        // Handle success
        refreshDashboard();
      }}
      userTier="business"
      userCurrency="EUR"
      variant="default"
      size="lg"
    >
      Add New Subscription
    </AddSubscriptionButton>
  );
}
```

## Props

### AddSubscriptionModal Props
```typescript
interface AddSubscriptionModalProps {
  open: boolean;                    // Controls modal visibility
  onOpenChange: (open: boolean) => void; // Callback for modal state changes
  onSuccess?: () => void;           // Called after successful submission
  userTier?: string;               // User's subscription tier (affects limits)
  userCurrency?: string;           // User's preferred currency
}
```

### AddSubscriptionButton Props
```typescript
interface AddSubscriptionButtonProps {
  onSuccess?: () => void;           // Called after successful submission
  userTier?: string;               // User's subscription tier
  userCurrency?: string;           // User's preferred currency
  variant?: "default" | "outline" | "ghost"; // Button variant
  size?: "default" | "sm" | "lg";  // Button size
  className?: string;              // Additional CSS classes
  children?: React.ReactNode;      // Button content (defaults to "Add Subscription")
}
```

## Styling
- Uses Shadcn/ui Dialog component for modal structure
- Violet-600 primary color scheme matching BizSubs brand
- Dark theme support with slate-950 background
- Mobile responsive form layout with grid system
- Consistent with BizSubs design system

## Dependencies
- react-hook-form: Form state management
- @hookform/resolvers: Zod integration
- zod: Form validation schema
- @radix-ui/react-dialog: Modal component
- sonner: Toast notifications
- @supabase/supabase-js: Database operations

## Database Integration
Saves data to the `subscriptions` table with the following structure:
- Links to authenticated user via RLS policies
- References clients and projects tables
- Includes activity logging for audit trail
- Handles currency and business categorization
- Supports all billing cycles and statuses
