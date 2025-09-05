// Updated 2024-12-20: Utility functions for billing date calculations
// Handles automatic calculation of next billing dates based on start date and billing cycle

/**
 * Calculate the next billing date based on start date and billing cycle
 */
export function calculateNextBillingDate(
  startDate: string | Date,
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'annual'
): Date {
  const start = new Date(startDate);
  
  switch (billingCycle) {
    case 'weekly':
      return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      const monthly = new Date(start);
      monthly.setMonth(monthly.getMonth() + 1);
      return monthly;
    case 'quarterly':
      const quarterly = new Date(start);
      quarterly.setMonth(quarterly.getMonth() + 3);
      return quarterly;
    case 'annual':
      const annual = new Date(start);
      annual.setFullYear(annual.getFullYear() + 1);
      return annual;
    default:
      // Default to monthly
      const defaultMonthly = new Date(start);
      defaultMonthly.setMonth(defaultMonthly.getMonth() + 1);
      return defaultMonthly;
  }
}

/**
 * Format date for display in forms and UI
 */
export function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Format date for display to users
 */
export function formatDateForDisplay(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get the default start date (today)
 */
export function getDefaultStartDate(): string {
  return formatDateForInput(new Date());
}

/**
 * Validate that a start date is not in the future (for existing subscriptions)
 * and not too far in the past (reasonable validation)
 */
export function validateStartDate(startDate: string): { isValid: boolean; error?: string } {
  const date = new Date(startDate);
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  // Allow dates up to one year in the past for existing subscriptions
  if (date < oneYearAgo) {
    return { isValid: false, error: 'Start date cannot be more than one year ago' };
  }
  
  // Allow future dates for planned subscriptions
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (date > oneYearFromNow) {
    return { isValid: false, error: 'Start date cannot be more than one year in the future' };
  }
  
  return { isValid: true };
}

/**
 * Calculate pro-rated amount based on start date and billing cycle
 * Used for tax calculations when subscription doesn't start at the beginning of a period
 */
export function calculateProRatedAmount(
  fullAmount: number,
  startDate: string | Date,
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'annual',
  referenceDate?: Date
): number {
  const start = new Date(startDate);
  const reference = referenceDate || new Date();
  
  // If start date is in the future, no pro-rating needed
  if (start > reference) {
    return 0;
  }
  
  // Calculate the period length in days
  let periodDays: number;
  switch (billingCycle) {
    case 'weekly':
      periodDays = 7;
      break;
    case 'monthly':
      // Use average month length (30.44 days)
      periodDays = 30.44;
      break;
    case 'quarterly':
      // 3 months average
      periodDays = 91.31;
      break;
    case 'annual':
      periodDays = 365.25;
      break;
    default:
      periodDays = 30.44;
  }
  
  // Calculate days from start to reference
  const daysSinceStart = Math.floor((reference.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  
  // If more than one full period has passed, return full amount
  if (daysSinceStart >= periodDays) {
    return fullAmount;
  }
  
  // Calculate pro-rated amount
  const proRatedAmount = (daysSinceStart / periodDays) * fullAmount;
  return Math.max(0, proRatedAmount);
}
