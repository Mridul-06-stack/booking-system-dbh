function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getBookableDates(now = new Date()) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return { today: formatLocalDate(today), tomorrow: formatLocalDate(tomorrow) };
}

function isBookableDate(date, now) {
    const { today, tomorrow } = getBookableDates(now);
    return date === today || date === tomorrow;
}

module.exports = { getBookableDates, isBookableDate };
