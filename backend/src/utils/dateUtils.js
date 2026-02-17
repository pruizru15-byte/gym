/**
 * Add days to a date
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format datetime to YYYY-MM-DD HH:MM:SS
 */
function formatDateTime(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get today's date at midnight
 */
function getTodayStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/**
 * Get today's date at end of day
 */
function getTodayEnd() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round((d2 - d1) / oneDay);
}

/**
 * Check if a date is in the past
 */
function isPast(date) {
    return new Date(date) < new Date();
}

/**
 * Check if date is within X days from now
 */
function isWithinDays(date, days) {
    const futureDate = addDays(new Date(), days);
    const checkDate = new Date(date);
    return checkDate <= futureDate && checkDate >= new Date();
}

module.exports = {
    addDays,
    formatDate,
    formatDateTime,
    getTodayStart,
    getTodayEnd,
    daysBetween,
    isPast,
    isWithinDays
};
