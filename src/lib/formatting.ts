/**
 * Formatting Utilities
 *
 * Common formatting functions for dates, times, prices, and data display.
 * These utilities handle null/undefined values gracefully.
 */

/**
 * Safely parse a date string and return a valid Date or null
 */
export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;

  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
};

/**
 * Check if a date string is valid
 */
export const isValidDate = (dateString: string | null | undefined): boolean => {
  return parseDate(dateString) !== null;
};

/**
 * Format a date string to short format (e.g., "Sat, Dec 28")
 * Returns fallback string if date is invalid
 */
export const formatDateShort = (
  dateString: string | null | undefined,
  fallback = 'Date TBD'
): string => {
  const date = parseDate(dateString);
  if (!date) return fallback;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a date string to long format (e.g., "Saturday, December 28, 2024")
 * Returns fallback string if date is invalid
 */
export const formatDateLong = (
  dateString: string | null | undefined,
  fallback = 'Date TBD'
): string => {
  const date = parseDate(dateString);
  if (!date) return fallback;

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a date string to medium format (e.g., "Dec 28, 2024")
 * Returns fallback string if date is invalid
 */
export const formatDateMedium = (
  dateString: string | null | undefined,
  fallback = 'Date TBD'
): string => {
  const date = parseDate(dateString);
  if (!date) return fallback;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a date range (e.g., "Dec 28 - Jan 2, 2025")
 */
export const formatDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  fallback = 'Dates TBD'
): string => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start) return fallback;
  if (!end) return formatDateMedium(startDate, fallback);

  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  // Same month and year
  if (startMonth === endMonth && startYear === endYear) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${endYear}`;
  }

  // Different months or years
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

/**
 * Format time safely
 */
export const formatTime = (
  timeString: string | null | undefined,
  fallback = 'Time TBD'
): string => {
  if (!timeString || timeString.trim() === '') return fallback;
  return timeString;
};

/**
 * Format price as currency
 */
export const formatPrice = (
  price: number | null | undefined,
  fallback = 'Price TBD'
): string => {
  if (price === null || price === undefined || isNaN(price)) return fallback;
  return `$${price}`;
};

/**
 * Format location string safely
 */
export const formatLocation = (
  city: string | null | undefined,
  state: string | null | undefined,
  fallback = 'Location TBD'
): string => {
  if (!city && !state) return fallback;
  if (!city) return state || fallback;
  if (!state) return city || fallback;
  return `${city}, ${state}`;
};

/**
 * Get stock status message
 */
export const getStockStatus = (
  stock: number | null | undefined,
  threshold = 5
): {
  message: string | null;
  variant: 'warning' | 'error' | 'success' | null;
  isSoldOut: boolean;
} => {
  if (stock === null || stock === undefined || isNaN(stock)) {
    return { message: null, variant: null, isSoldOut: false };
  }

  if (stock <= 0) {
    return { message: 'Sold Out', variant: 'error', isSoldOut: true };
  }

  if (stock <= threshold) {
    return {
      message: `Only ${stock} spot${stock === 1 ? '' : 's'} left!`,
      variant: 'warning',
      isSoldOut: false,
    };
  }

  return { message: null, variant: null, isSoldOut: false };
};

/**
 * Safely get a string value with fallback
 */
export const safeString = (
  value: string | null | undefined,
  fallback = ''
): string => {
  if (value === null || value === undefined || value === 'null') return fallback;
  return value;
};

/**
 * Format program subtitle for cards
 */
export const formatProgramSubtitle = (
  date: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined
): string => {
  const formattedDate = formatDateShort(date, '');
  const formattedLocation = formatLocation(city, state, '');

  if (!formattedDate && !formattedLocation) return 'Details coming soon';
  if (!formattedDate) return formattedLocation;
  if (!formattedLocation) return formattedDate;

  return `${formattedDate} • ${formattedLocation}`;
};
