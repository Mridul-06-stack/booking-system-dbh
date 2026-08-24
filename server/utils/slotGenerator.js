/**
 * Format a Date object to YYYY-MM-DD using local timezone (not UTC).
 */
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Generate time slots dynamically based on start/end hours and slot duration in minutes.
 * Default: 06:00 to 22:00 with 60-minute duration.
 * Returns an array of { startTime, endTime } objects (formatted as HH:MM).
 */
function generateSlots(startHour = 6, endHour = 22, durationMinutes = 60) {
    const slots = [];
    const totalStartMinutes = startHour * 60;
    const totalEndMinutes = endHour * 60;

    for (let m = totalStartMinutes; m + durationMinutes <= totalEndMinutes; m += durationMinutes) {
        const startH = String(Math.floor(m / 60)).padStart(2, '0');
        const startM = String(m % 60).padStart(2, '0');
        const endMins = m + durationMinutes;
        const endH = String(Math.floor(endMins / 60)).padStart(2, '0');
        const endM = String(endMins % 60).padStart(2, '0');

        slots.push({
            startTime: `${startH}:${startM}`,
            endTime: `${endH}:${endM}`,
        });
    }

    return slots;
}

/**
 * Get the Monday of the current week for a given date string (YYYY-MM-DD).
 * Uses local timezone to avoid UTC date shift issues.
 */
function getWeekStart(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust for Sunday
    d.setDate(diff);
    return formatLocalDate(d);
}

/**
 * Get Sunday of the current week for a given date string (YYYY-MM-DD).
 * Uses local timezone to avoid UTC date shift issues.
 */
function getWeekEnd(dateStr) {
    const weekStart = new Date(getWeekStart(dateStr) + 'T00:00:00');
    weekStart.setDate(weekStart.getDate() + 6);
    return formatLocalDate(weekStart);
}

module.exports = { generateSlots, getWeekStart, getWeekEnd };
