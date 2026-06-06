const schedule = require("node-schedule");

const {
    saveAutoPDF
} = require("./pdfService");

const {
    writeErrorLog
} = require("./loggerService");

function startScheduler() {
    schedule.scheduleJob(
        "0 15 * * *",
        async () => {
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