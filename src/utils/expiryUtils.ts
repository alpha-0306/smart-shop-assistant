/**
 * Expiry Utilities
 * Helper functions for expiry date calculations and formatting
 */

/**
 * Calculate days until expiry
 */
export function daysUntilExpiry(expiryDate: number): number {
  const now = Date.now();
  const diff = expiryDate - now;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/**
 * Check if a date is expired
 */
export function isExpired(expiryDate: number): boolean {
  return expiryDate <= Date.now();
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(expiryDate: number): string {
  const date = new Date(expiryDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get expiry status text
 */
export function getExpiryStatus(expiryDate: number): {
  text: string;
  color: string;
  urgent: boolean;
} {
  const days = daysUntilExpiry(expiryDate);

  if (days < 0) {
    return {
      text: 'Expired',
      color: '#DC2626', // Dark red
      urgent: true,
    };
  } else if (days === 0) {
    return {
      text: 'Expires today',
      color: '#EF4444', // Red
      urgent: true,
    };
  } else if (days === 1) {
    return {
      text: 'Expires tomorrow',
      color: '#EF4444', // Red
      urgent: true,
    };
  } else if (days <= 3) {
    return {
      text: `${days} days left`,
      color: '#F59E0B', // Orange
      urgent: true,
    };
  } else if (days <= 7) {
    return {
      text: `${days} days left`,
      color: '#FBBF24', // Yellow
      urgent: false,
    };
  } else {
    return {
      text: `${days} days left`,
      color: '#10B981', // Green
      urgent: false,
    };
  }
}

/**
 * Get earliest expiry from multiple dates
 */
export function getEarliestExpiry(expiryDates: (number | null | undefined)[]): number | null {
  const validDates = expiryDates.filter((d): d is number => d != null && d > 0);
  if (validDates.length === 0) return null;
  return Math.min(...validDates);
}
