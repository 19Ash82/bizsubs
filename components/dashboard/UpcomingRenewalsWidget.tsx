// Updated 2024-12-19: Created UpcomingRenewalsWidget component for showing upcoming subscription renewals

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: string;
  service_name: string;
  cost: number;
  currency: string;
  next_billing_date: string;
  billing_cycle: string;
  client_name?: string;
  client_color?: string;
  status: string;
}

interface UpcomingRenewalsWidgetProps {
  subscriptions: Subscription[];
  onViewAll?: () => void;
  onMarkAsPaid?: (subscriptionId: string) => void;
}

export function UpcomingRenewalsWidget({
  subscriptions,
  onViewAll,
  onMarkAsPaid,
}: UpcomingRenewalsWidgetProps) {
  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 0 && diffDays <= 7) return `${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const getUrgencyColor = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "bg-red-100 text-red-800";
    if (diffDays <= 3) return "bg-orange-100 text-orange-800";
    if (diffDays <= 7) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const displayClientName = (subscription: Subscription) => {
    if (!subscription.client_name) return null;
    
    // For now, just show the client name. In the future, we could implement
    // the "Client A +3 more" pattern if a subscription is assigned to multiple clients
    return subscription.client_name;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Renewals</h3>
        {onViewAll && (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m6-10v10m-6 0h6"
            />
          </svg>
          <p className="text-sm">No upcoming renewals in the next 30 days</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-gray-900">
                    {subscription.service_name}
                  </h4>
                  {displayClientName(subscription) && (
                    <div className="flex items-center gap-2">
                      {subscription.client_color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subscription.client_color }}
                        />
                      )}
                      <span className="text-sm text-gray-600">
                        {displayClientName(subscription)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-medium">
                    {formatCurrency(subscription.cost, subscription.currency)}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{subscription.billing_cycle}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={getUrgencyColor(subscription.next_billing_date)}
                >
                  {formatDate(subscription.next_billing_date)}
                </Badge>
                {onMarkAsPaid && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMarkAsPaid(subscription.id)}
                    className="text-xs"
                  >
                    Mark Paid
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {subscriptions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {subscriptions.length} renewal{subscriptions.length !== 1 ? 's' : ''} in next 30 days
            </span>
            <span className="font-medium text-gray-900">
              Total: {formatCurrency(
                subscriptions.reduce((sum, sub) => sum + sub.cost, 0),
                subscriptions[0]?.currency || 'USD'
              )}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}



