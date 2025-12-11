/**
 * Timezone utility functions for IST (Indian Standard Time) conversion
 * 
 * The application uses IST (UTC+5:30) for all user-facing times.
 * Backend stores all times in UTC.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30

/**
 * Convert UTC date to IST date
 * @param {Date|string} utcDate - UTC date object or ISO string
 * @returns {Date} Date object in IST
 */
export const utcToIST = (utcDate) => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(date.getTime() + IST_OFFSET_MS);
};

/**
 * Convert IST date to UTC date
 * @param {Date|string} istDate - IST date object or datetime string (without timezone)
 * @returns {Date} Date object in UTC
 */
export const istToUTC = (istDate) => {
  const date = typeof istDate === 'string' ? new Date(istDate) : istDate;
  return new Date(date.getTime() - IST_OFFSET_MS);
};

/**
 * Format UTC date as IST string
 * @param {Date|string} utcDate - UTC date object or ISO string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted IST date string
 */
export const formatIST = (utcDate, options = {}) => {
  const istDate = utcToIST(utcDate);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  };
  
  const formatted = istDate.toLocaleString('en-IN', defaultOptions);
  return `${formatted} IST`;
};

/**
 * Get current time in IST
 * @returns {Date} Current date/time in IST
 */
export const nowIST = () => {
  return utcToIST(new Date());
};

/**
 * Convert datetime-local input value to UTC ISO string
 * Used when sending contest start times to backend
 * @param {string} datetimeLocal - Value from datetime-local input (YYYY-MM-DDTHH:mm)
 * @returns {string} UTC ISO string
 */
export const datetimeLocalISTToUTC = (datetimeLocal) => {
  // datetime-local gives us YYYY-MM-DDTHH:mm
  // We treat this as IST and convert to UTC
  const istDate = new Date(datetimeLocal);
  const utcDate = istToUTC(istDate);
  return utcDate.toISOString();
};

/**
 * Convert UTC ISO string to datetime-local format in IST
 * Used when populating datetime-local inputs
 * @param {string} utcISO - UTC ISO string
 * @returns {string} datetime-local format (YYYY-MM-DDTHH:mm) in IST
 */
export const utcToDatetimeLocalIST = (utcISO) => {
  const istDate = utcToIST(utcISO);
  return istDate.toISOString().slice(0, 16);
};
