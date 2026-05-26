function getToday() {
    const today = new Date();

    return (
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0")
    );
}

function getTimeStamp() {
    const now = new Date();

    return (
        String(now.getHours()).padStart(2, "0") + "-" +
        String(now.getMinutes()).padStart(2, "0")
    );
}

module.exports = {
    getToday,
    getTimeStamp
};