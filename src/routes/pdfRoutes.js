const express = require("express");
const fs = require("fs");
const path = require("path");

const {
    writeErrorLog
} = require("../loggerService");

const {
    ensureConfigured
} = require("../configService");

const {
    generatePDFBuffer
} = require("../pdfService");

const {
    ensureDailyFolder
} = require("../reportService");

const {
    getToday
} = require("../utils/date");

const router = express.Router();

router.get("/exportPDF", async (req, res) => {

    const ip = (req.ip || "")
        .replace("::ffff:", "");

    const machineName =
        req.query.machineName ||
        "Unknown-PC";

    const isHost =
        req.query.isHost === "true";

    console.log("");
    console.log("================================");
    console.log("PDF EXPORT REQUEST");
    console.log("================================");
    console.log(`Machine: ${machineName}`);
    console.log(`IP: ${ip}`);
    console.log(`Host: ${isHost}`);
    console.log("");

    try {

        if (!ensureConfigured(res)) {
            return;
        }

        const pdfBuffer =
            await generatePDFBuffer(
                machineName
            );

        const date =
            getToday();

        const fileName =
            `DOR-${date}.pdf`;

        if (isHost) {

            const dailyFolder =
                ensureDailyFolder(date);

            const pdfPath =
                path.join(
                    dailyFolder,
                    fileName
                );

            fs.writeFileSync(
                pdfPath,
                pdfBuffer
            );

            console.log("");
            console.log("PDF SAVED");
            console.log(pdfPath);
            console.log("");
        }

        res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Disposition":
                `attachment; filename="${fileName}"`,
            "Content-Length":
                pdfBuffer.length,
            "X-PDF-File-Name":
                fileName
        });

        res.end(pdfBuffer);

    } catch (err) {

        console.error("");
        console.error("PDF ERROR");
        console.error(err);
        console.error("");

        writeErrorLog(
            "PDF EXPORT ERROR",
            err,
            {
                machineName,
                ip,
                isHost,
                route: "/exportPDF"
            }
        );

        res
            .status(500)
            .send("PDF Export Failed");
    }
});

module.exports = router;