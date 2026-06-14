const { exec } = require("child_process");
const path = require("path");

const GIT_PATH = path.join(
    __dirname,
    "..",
    "portable-git",
    "PortableGit",
    "bin",
    "git.exe"
);

const UPDATE_BAT = path.join(
    __dirname,
    "..",
    "update.bat"
);

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, {
            cwd: path.join(__dirname, "..")
        }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            resolve({
                stdout,
                stderr
            });
        });
    });
}

async function checkForUpdate() {
    await runCommand(`"${GIT_PATH}" fetch origin`);

    const local = await runCommand(
        `"${GIT_PATH}" rev-parse HEAD`
    );

    const remote = await runCommand(
        `"${GIT_PATH}" rev-parse origin/main`
    );

    return {
        hasUpdate:
            local.stdout.trim() !== remote.stdout.trim(),
        localCommit:
            local.stdout.trim(),
        remoteCommit:
            remote.stdout.trim()
    };
}

const { spawn } = require("child_process");

function runUpdate() {

    spawn(
        "cmd",
        [
            "/c",
            "start",
            "",
            "update.bat"
        ],
        {
            detached: true,
            stdio: "ignore",
            cwd: path.join(__dirname, "..")
        }
    ).unref();
}
module.exports = {
    checkForUpdate,
    runUpdate
};