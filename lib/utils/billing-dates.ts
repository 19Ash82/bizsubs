// Updated 2024-12-20: Utility functions for billing date calculations
// Handles automatic calculation of next billing dates based on start date and billing cycle

/**
 * Calculate the next billing date based on start date and billing cycle
 * This finds the next future billing date from today, accounting for multiple past cycles
 */
export function calculateNextBillingDate(
  startDate: string | Date,
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'annual'
): Date {
  // Parse date string as local date to avoid timezone issues
  let start: Date;
  if (typeof startDate === 'string') {
    // Parse YYYY-MM-DD as local date, not UTC
    const [year, month, day] = startDate.split('-').map(Number);
    start = new Date(year, month - 1, day); // month is 0-indexed
  } else {
    start = new Date(startDate);
  }
  
  const today = new Date();
  
  // Set time to start of day for consistent comparisons
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // If start date is in the future, return the start date
  if (start > today) {
    return start;
  }
  
  let nextBilling = new Date(start);
  
  // Keep adding billing cycles until we get a future date
  while (nextBilling <= today) {
    switch (billingCycle) {
      case 'weekly':
        nextBilling.setDate(nextBilling.getDate() + 7);
        break;
      case 'monthly':
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        break;
      case 'quarterly':
        nextBilling.setMonth(nextBilling.getMonth() + 3);
        break;
      case 'annual':
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        break;
      default:
        // Default to monthly
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        break;
    }
  }
  
  return nextBilling;
}

/**
 * Format date for display in forms and UI
 */
export function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Format date for display to users with unambiguous format
 * Uses month names to avoid MM/DD/YYYY vs DD/MM/YYYY confusion
 * Always uses English locale to prevent French/other locale issues
 */
export function formatDateForDisplay(date: Date | string): string {
  const d = new Date(date);
  // Force English locale to prevent French dates (jj/mm/aa)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date for display with explicit locale preference
 */
export function formatDateForDisplayWithLocale(date: Date | string, locale?: string, dateFormat?: 'US' | 'EU' | 'ISO'): string {
  const d = new Date(date);
  
  // Always force English locales to prevent French/other language dates
  // Default to unambiguous format with month names
  if (!dateFormat || dateFormat === 'US') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  if (dateFormat === 'EU') {
    // Use en-GB but still English language
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  if (dateFormat === 'ISO') {
    return d.toISOString().split('T')[0];
  }
  
  // Fallback to unambiguous format in English
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
 * This calculates the partial period amount, not total accumulated cost
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

/**
 * Calculate total accumulated subscription cost from start date to reference date
 * This fixes the calculation bug where Aug 4 - Sep 20 should show ~$155 for $100/month
 */
export function calculateAccumulatedCost(
  monthlyAmount: number,
  startDate: string | Date,
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'annual',
  endDate?: Date
): number {
  const start = new Date(startDate);
  const end = endDate || new Date();
  
  // If start date is in the future, no cost accumulated yet
  if (start > end) {
    return 0;
  }
  
  // Convert billing amount to monthly equivalent
  let monthlyEquivalent: number;
  switch (billingCycle) {
    case 'weekly':
      monthlyEquivalent = monthlyAmount * (30.44 / 7); // ~4.35 weeks per month
      break;
    case 'monthly':
      monthlyEquivalent = monthlyAmount;
      break;
    case 'quarterly':
      monthlyEquivalent = monthlyAmount / 3;
      break;
    case 'annual':
      monthlyEquivalent = monthlyAmount / 12;
      break;
    default:
      monthlyEquivalent = monthlyAmount;
  }
  
  // Calculate total days between start and end
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  
  // Calculate accumulated cost based on days (using 30.44 average days per month)
  const monthsEquivalent = totalDays / 30.44;
  const accumulatedCost = monthsEquivalent * monthlyEquivalent;
  
  return Math.max(0, accumulatedCost);
}

/**
 * Validate date input to prevent ambiguous date parsing
 * Ensures dates are in YYYY-MM-DD format
 */
export function validateDateFormat(dateString: string): { isValid: boolean; error?: string; parsedDate?: Date } {
  // Check if it's in ISO format (YYYY-MM-DD)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(dateString)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  const date = new Date(dateString + 'T00:00:00.000Z'); // Parse as UTC to avoid timezone issues
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  return { isValid: true, parsedDate: date };
}
