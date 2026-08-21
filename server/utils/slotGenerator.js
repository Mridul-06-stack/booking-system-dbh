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
 */
function getWeekStart(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust for Sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
}

/**
 * Get Sunday of the current week for a given date string (YYYY-MM-DD).
 */
function getWeekEnd(dateStr) {
    const weekStart = new Date(getWeekStart(dateStr) + 'T00:00:00');
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() + 6);
    return sunday.toISOString().split('T')[0];
}

module.exports = { generateSlots, getWeekStart, getWeekEnd };
