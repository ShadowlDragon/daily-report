const schedule = require("node-schedule");

const {
    saveAutoPDF
} = require("./pdfService");

const {
    getConfig
} = require("./configService");

const {
    writeErrorLog
} = require("./loggerService");

function startScheduler() {
    schedule.scheduleJob(
        "0 15 * * *",
        async () => {
            const config = getConfig();

            if (config.autoPdfExport === false) {
                console.log("AUTO PDF SKIPPED: Disabled in config");
                return;
            }
            
            console.log("");
            console.log("================================");
            console.log("3PM AUTO PDF EXPORT");
            console.log("================================");
            console.log("");

            try {
                await saveAutoPDF();

            } catch (err) {
                console.error("");
                console.error("AUTO PDF ERROR");
                console.error(err);
                console.error("");
            
                writeErrorLog(
                    "AUTO PDF ERROR",
                    err,
                    {
                        job: "3PM AUTO PDF EXPORT"
                    }
                );
            }
        }
    );
}

module.exports = {
    startScheduler
};