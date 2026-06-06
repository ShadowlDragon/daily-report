const fs = require("fs");
const path = require("path");

const {
    getConfig
} = require("./configService");

const {
    ensureDailyFolder
} = require("./reportService");

const {
    getToday
} = require("./utils/date");

function getDateTimeText() {
    const now = new Date();

    return (
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0") + " " +
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0") + ":" +
        String(now.getSeconds()).padStart(2, "0")
    );
}

function formatError(error) {
    if (!error) return "Unknown error";

    if (error.stack) {
        return error.stack;
    }

    if (error.message) {
        return error.message;
    }

    return String(error);
}

function writeErrorLog(title, error, extra = {}) {
    try {
        const config = getConfig();

        if (!config.reportFolder) {
            console.error("LOGGER SKIPPED: report folder not configured");
            console.error(error);
            return;
        }

        const date = getToday();

        const dailyFolder = ensureDailyFolder(date);

        const logPath = path.join(
            dailyFolder,
            "error-log.txt"
        );

        const logText = [
            "========================================",
            `[${getDateTimeText()}] ${title}`,
            "----------------------------------------",
            formatError(error),
            "----------------------------------------",
            `Extra: ${JSON.stringify(extra, null, 2)}`,
            ""
        ].join("\n");

        fs.appendFileSync(
            logPath,
            logText,
            "utf8"
        );

    } catch (logErr) {
        console.error("WRITE ERROR LOG FAILED");
        console.error(logErr);
        console.error(error);
    }
}

module.exports = {
    writeErrorLog
};