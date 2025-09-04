// Updated 2024-12-19: Created QuickActionButtons component for dashboard quick actions

"use client";

import { Button } from "@/components/ui/button";

interface QuickActionButtonsProps {
  onAddSubscription?: () => void;
  onAddLifetimeDeal?: () => void;
  onExportReport?: () => void;
  onInviteTeamMember?: () => void;
  userTier?: string;
}

export function QuickActionButtons({
  onAddSubscription,
  onAddLifetimeDeal,
  onExportReport,
  onInviteTeamMember,
  userTier = 'free',
}: QuickActionButtonsProps) {
  const isBusinessTier = userTier === 'business' || userTier === 'business_premium';

  const actions = [
    {
      id: 'add-subscription',
      label: 'Add Subscription',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: onAddSubscription,
      variant: 'default' as const,
      available: true,
    },
    {
      id: 'add-lifetime-deal',
      label: 'Add Lifetime Deal',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      onClick: onAddLifetimeDeal,
      variant: 'outline' as const,
      available: true,
    },
    {
      id: 'export-report',
      label: 'Export Report',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: onExportReport,
      variant: 'outline' as const,
      available: true,
    },
    {
      id: 'invite-team-member',
      label: 'Invite Team Member',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      onClick: onInviteTeamMember,
      variant: 'outline' as const,
      available: isBusinessTier,
    },
  ];

  const availableActions = actions.filter(action => action.available);

  return (
    <div className="flex flex-wrap gap-3">
      {availableActions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant}
          onClick={action.onClick}
          className="flex items-center gap-2"
          disabled={!action.onClick}
        >
          {action.icon}
          <span>{action.label}</span>
        </Button>
      ))}
      
      {!isBusinessTier && (
        <Button
          variant="outline"
          className="flex items-center gap-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-600"
          onClick={() => {
            // Navigate to upgrade page
            window.location.href = '/upgrade';
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Upgrade for Team Features</span>
        </Button>
      )}
    </div>
  );
}



