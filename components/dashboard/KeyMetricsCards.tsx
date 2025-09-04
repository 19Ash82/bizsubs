// Updated 2024-12-19: Created KeyMetricsCards component for dashboard metrics display

import { Card } from "@/components/ui/card";

interface MetricsData {
  totalMonthlyRecurring: number;
  annualBusinessSpend: number;
  taxDeductibleAmount: number;
  thisMonthRenewals: number;
  currency?: string;
}

interface KeyMetricsCardsProps {
  metrics: MetricsData;
}

export function KeyMetricsCards({ metrics }: KeyMetricsCardsProps) {
  const { 
    totalMonthlyRecurring, 
    annualBusinessSpend, 
    taxDeductibleAmount, 
    thisMonthRenewals,
    currency = 'USD'
  } = metrics;

  const formatCurrency = (amount: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  const metricsData = [
    {
      title: "Total Monthly Recurring",
      value: formatCurrency(totalMonthlyRecurring),
      description: "Monthly subscription costs",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Annual Business Spend",
      value: formatCurrency(annualBusinessSpend),
      description: "Total yearly expenses",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Tax Deductible Amount",
      value: formatCurrency(taxDeductibleAmount),
      description: "Business expense deductions",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "This Month's Renewals",
      value: formatCurrency(thisMonthRenewals),
      description: "Upcoming renewals",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metricsData.map((metric, index) => (
        <Card key={index} className="p-6">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${metric.bgColor} mb-4`}>
            <div className={`w-6 h-6 ${metric.color}`}>
              {/* Icon placeholder - can be replaced with actual icons */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
            <p className="text-sm text-gray-500">{metric.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}



