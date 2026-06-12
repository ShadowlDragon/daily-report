const schedule = require("node-schedule");
let updateJob = null;

const {
    checkForUpdate
} = require("./updateService");

function setupUpdateScheduler(io) {
    if (updateJob) {
        updateJob.cancel();
    }

    updateJob = schedule.scheduleJob(
        "0 19 * * *",
        async () => {
            try {
                console.log("Checking update at 19:00...");

                const result =
                    await checkForUpdate();

                if (!result.hasUpdate) {
                    console.log("No update available.");
                    return;
                }

                console.log("Update available.");

                io.emit(
                    "updateAvailable",
                    {
                        remoteCommit:
                            result.remoteCommit
                    }
                );

                console.log("Socket event sent.");

            } catch (err) {
                console.error("UPDATE CHECK ERROR");
                console.error(err);
            }
        }
    );
}

module.exports = setupUpdateScheduler;