const express = require("express");

const {
    writeErrorLog
} = require("../loggerService");

const {
    ensureConfigured
} = require("../configService");

const {
    generatePDFBuffer
} = require("../pdfService");

const router = express.Router();

router.get("/exportPDF", async (req, res) => {
    const ip = (req.ip || "")
        .replace("::ffff:", "");

    const machineName =
        req.query.machineName ||
        "Unknown-PC";

    console.log("");
    console.log("================================");
    console.log("PDF EXPORT REQUEST");
    console.log("================================");
    console.log(`Machine: ${machineName}`);
    console.log(`IP: ${ip}`);
    console.log("");

    try {
        if (!ensureConfigured(res)) return;

        const pdfBuffer = await generatePDFBuffer(
            machineName
        );

        res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=report.pdf",
            "Content-Length": pdfBuffer.length
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
                route: "/exportPDF"
            }
        );
    
        res
            .status(500)
            .send("PDF Export Failed");
    }
});

module.exports = router;