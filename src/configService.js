const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "..", "config.json");

let REPORT_FOLDER = "";
let RIG_NAME = "";

function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        REPORT_FOLDER = "";
        RIG_NAME = "";
        return;
    }

    try {
        const config = JSON.parse(
            fs.readFileSync(CONFIG_PATH, "utf8")
        );

        REPORT_FOLDER = config.reportFolder || "";
        RIG_NAME = config.rigName || "";

    } catch (err) {
        console.error("CONFIG LOAD ERROR:");
        console.error(err);

        REPORT_FOLDER = "";
        RIG_NAME = "";
    }
}

function saveConfig(folder, rigName) {
    REPORT_FOLDER = folder;
    RIG_NAME = rigName;

    if (!fs.existsSync(REPORT_FOLDER)) {
        fs.mkdirSync(REPORT_FOLDER, {
            recursive: true
        });
    }

    fs.writeFileSync(
        CONFIG_PATH,
        JSON.stringify(
            {
                reportFolder: REPORT_FOLDER,
                rigName: RIG_NAME
            },
            null,
            2
        )
    );
}

function getConfig() {
    return {
        reportFolder: REPORT_FOLDER,
        rigName: RIG_NAME,
        hasConfig: !!REPORT_FOLDER && !!RIG_NAME
    };
}

function ensureConfigured(res) {
    if (!REPORT_FOLDER) {
        res
            .status(400)
            .send("Report folder is not configured");

        return false;
    }

    return true;
}

loadConfig();

module.exports = {
    getConfig,
    saveConfig,
    ensureConfigured
};