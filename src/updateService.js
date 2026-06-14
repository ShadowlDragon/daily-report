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
        `"${GIT_PATH}" rev-parse origin/dev`
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

function runUpdate() {
    exec(
        `cmd /c start "" "${UPDATE_BAT}"`,
        {
            cwd: path.join(__dirname, "..")
        }
    );
}

module.exports = {
    checkForUpdate,
    runUpdate
};