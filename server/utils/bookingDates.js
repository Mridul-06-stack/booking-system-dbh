function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getBookableDates(now = new Date()) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    return { today: formatLocalDate(today) };
}

function isBookableDate(date, now) {
    const { today } = getBookableDates(now);
    return date === today;
}

module.exports = { getBookableDates, isBookableDate };
