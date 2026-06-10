const express = require("express");

const {
    getConfig,
    saveConfig
} = require("../configService");

const {
    isLocalRequest
} = require("../utils/network");

const router = express.Router();

router.get("/", (req, res) => {
    const config = getConfig();

    res.json({
        hasConfig: config.hasConfig,
        reportFolder: config.reportFolder,
        rigName: config.rigName,
        autoPdfExport: config.autoPdfExport !== false,
        isHost: isLocalRequest(req)
    });
});

router.post("/", (req, res) => {
    if (!isLocalRequest(req)) {
        return res
            .status(403)
            .send("Only server host can change report folder");
    }

    const {
        reportFolder,
        rigName,
        autoPdfExport
    } = req.body;

    if (!reportFolder) {
        return res
            .status(400)
            .send("Missing report folder");
    }

    if (!rigName) {
        return res
            .status(400)
            .send("Missing rig name");
    }

    try {
        saveConfig(
            reportFolder,
            rigName,
            autoPdfExport === true ||
            autoPdfExport === "true"
        );

        res.send("saved");

    } catch (err) {
        console.error(err);

        res
            .status(500)
            .send(err.message);
    }
});

module.exports = router;