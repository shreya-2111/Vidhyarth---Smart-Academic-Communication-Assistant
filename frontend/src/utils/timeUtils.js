// Utility functions for time formatting

/**
 * Format time from 24-hour to 12-hour format
 * @param {string} time24 - Time in 24-hour format (HH:MM or HH:MM:SS)
 * @returns {string} Time in 12-hour format with AM/PM
 */
export const formatTo12Hour = (time24) => {
  if (!time24) return '';
  
  // Clean up and check AM/PM
  const cleanStr = time24.trim().toUpperCase();
  const match = cleanStr.match(/(\d+):(\d+)/);
  if (!match) return cleanStr;
  
  let [_, h, m] = match;
  let hour = parseInt(h, 10);
  
  // Heuristic: If time is between 1 and 6 without explicit AM, assume PM for timetables
  if (!cleanStr.includes('AM') && !cleanStr.includes('PM') && hour >= 1 && hour <= 6) {
    hour += 12;
  }
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${m} ${ampm}`;
};

/**
 * Format time from 24-hour to 12-hour format WITHOUT AM/PM
 * @param {string} time24 - Time in 24-hour format (HH:MM or HH:MM:SS)
 * @returns {string} Time in 12-hour format without AM/PM
 */
export const formatTo12HourNoAMPM = (time24) => {
  if (!time24) return '';
  
  const cleanStr = time24.trim().toUpperCase();
  const match = cleanStr.match(/(\d+):(\d+)/);
  if (!match) return cleanStr;
  
  let [_, h, m] = match;
  let hour = parseInt(h, 10);
  
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${m}`;
};

/**
 * Format Date object to 12-hour time string
 * @param {Date} date - Date object
 * @returns {string} Time in 12-hour format with AM/PM
 */
export const formatDateTo12Hour = (date) => {
  if (!date || !(date instanceof Date)) return '';
  
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Format Date object to date and time in 12-hour format
 * @param {Date} date - Date object
 * @returns {string} Date and time in 12-hour format
 */
export const formatDateTimeTo12Hour = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return dateObj.toLocaleString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Get real-time greeting based on current hour
 * @returns {string} Greeting message
 */
export const getRealTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
};

/**
 * Helper to get absolute minutes for sorting, handling AM/PM and heuristics
 */
const parseTimeValue = (timeStr) => {
  if (!timeStr) return 0;
  
  const cleanStr = timeStr.trim().toUpperCase();
  const isPM = cleanStr.includes('PM');
  const isAM = cleanStr.includes('AM');
  
  const match = cleanStr.match(/(\d+):(\d+)/);
  if (!match) return 0;
  
  let [_, h, m] = match;
  let hour = parseInt(h, 10);
  let min = parseInt(m, 10);
  
  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;
  
  // Heuristic: If time is between 1 and 6 without explicit AM, assume PM for timetables
  if (!isAM && !isPM && hour >= 1 && hour <= 6) {
    hour += 12;
  }
  
  return hour * 60 + min;
};

/**
 * Compare two time strings in 24-hour format or 12-hour format
 * @param {string} a - Time string A
 * @param {string} b - Time string B
 * @returns {number} Comparison result for sorting
 */
export const compareTimes = (a, b) => {
  return parseTimeValue(a) - parseTimeValue(b);
};
