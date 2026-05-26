const express = require("express");

const {
    ensureConfigured
} = require("../configService");

const {
    loadReportFile,
    updateHeader,
    updateRowCount,
    updateCell
} = require("../reportService");

function createReportRoutes(io) {
    const router = express.Router();

    router.get("/load/:date", (req, res) => {
        try {
            const data = loadReportFile(
                req.params.date
            );

            res.json(data);

        } catch (err) {
            console.error(err);

            res
                .status(500)
                .send(err.message);
        }
    });

    router.post("/saveHeader", (req, res) => {
        try {
            if (!ensureConfigured(res)) return;

            const {
                date,
                key,
                value
            } = req.body;

            if (!date || !key) {
                return res
                    .status(400)
                    .send("Missing data");
            }

            updateHeader(
                date,
                key,
                value
            );

            io.emit("headerUpdated", {
                key,
                value
            });

            res.send("saved");

        } catch (err) {
            console.error(err);

            res
                .status(500)
                .send(err.message);
        }
    });

    router.post("/saveRows", (req, res) => {
        try {
            if (!ensureConfigured(res)) return;

            const {
                date,
                section,
                rowCount
            } = req.body;

            if (!date || !section || !rowCount) {
                return res
                    .status(400)
                    .send("Missing data");
            }

            updateRowCount(
                date,
                section,
                Number(rowCount)
            );

            res.send("saved");

        } catch (err) {
            console.error(err);

            res
                .status(500)
                .send(err.message);
        }
    });

    router.post("/saveCell", (req, res) => {
        try {
            if (!ensureConfigured(res)) return;

            const {
                date,
                cellId,
                value
            } = req.body;

            if (!date || !cellId) {
                return res
                    .status(400)
                    .send("Missing data");
            }

            updateCell(
                date,
                cellId,
                value
            );

            io.emit("cellUpdated", {
                cellId,
                value
            });

            res.send("saved");

        } catch (err) {
            console.error(err);

            res
                .status(500)
                .send(err.message);
        }
    });

    return router;
}

module.exports = createReportRoutes;