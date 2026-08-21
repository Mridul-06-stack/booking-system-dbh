/**
 * Generate 1-hour time slots between 06:00 and 22:00.
 * Returns an array of { startTime, endTime } objects.
 */
function generateSlots() {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
        slots.push({ startTime, endTime });
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
