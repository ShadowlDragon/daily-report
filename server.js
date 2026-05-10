// =========================
// SERVER.JS
// =========================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const os = require("os");

const puppeteer =
    require("puppeteer");

const fs =
    require("fs");

const path =
    require("path");

const app = express();

const server =
    http.createServer(app);

const io =
    new Server(server);

const SERVER_VERSION =
    Date.now().toString();

// =========================
// MIDDLEWARE
// =========================
app.use(express.json({
    limit: "50mb"
}));

app.use(express.static("public"));


// =========================
// REPORT FOLDER
// =========================
const REPORT_FOLDER =
"\\\\srv-File-r8\\Group\\Electronic Technician\\Public\\Daily Operation Report";

if (!fs.existsSync(REPORT_FOLDER)) {

    fs.mkdirSync(
        REPORT_FOLDER,
        {
            recursive: true
        }
    );
}


// =========================
// LOCKED CELLS
// =========================
const lockedCells = {};


// =========================
// LOAD REPORT FILE
// =========================
function loadReportFile(date) {

    const dailyFolder =
        path.join(REPORT_FOLDER, date);

    const filePath =
        path.join(
            dailyFolder,
            "report.json"
        );

    // EXISTING
    if (fs.existsSync(filePath)) {

        return JSON.parse(
            fs.readFileSync(filePath)
        );
    }

    // CLONE PREVIOUS DAY
    const previousDate =
        new Date(date);

    previousDate.setDate(
        previousDate.getDate() - 1
    );

    const prevDateStr =
        previousDate
        .toISOString()
        .split("T")[0];

    const prevFile =
        path.join(
            REPORT_FOLDER,
            prevDateStr,
            "report.json"
        );

    if (fs.existsSync(prevFile)) {

        const prevData =
            JSON.parse(
                fs.readFileSync(prevFile)
            );

        fs.mkdirSync(
            dailyFolder,
            {
                recursive: true
            }
        );

        fs.writeFileSync(
            filePath,
            JSON.stringify(
                prevData,
                null,
                2
            )
        );

        return prevData;
    }

    return {};
}


// =========================
// SAVE REPORT FILE
// =========================
function saveReportFile(
    date,
    data
) {

    const dailyFolder =
        path.join(REPORT_FOLDER, date);

    if (!fs.existsSync(dailyFolder)) {

        fs.mkdirSync(
            dailyFolder,
            {
                recursive: true
            }
        );
    }

    const filePath =
        path.join(
            dailyFolder,
            "report.json"
        );

    fs.writeFileSync(
        filePath,
        JSON.stringify(
            data,
            null,
            2
        )
    );
}


// =========================
// LOAD REPORT
// =========================
app.get("/load/:date", (req, res) => {

    try {

        const data =
            loadReportFile(
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


// =========================
// SAVE CELL
// =========================
app.post("/saveCell", (req, res) => {

    try {

        const {
            date,
            cellId,
            value
        } = req.body;

        const reportData =
            loadReportFile(date);

        reportData[cellId] =
            value;

        saveReportFile(
            date,
            reportData
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


// =========================
// EXPORT PDF
// =========================
app.get("/exportPDF", async (req, res) => {

    let browser;

    try {

        console.log("");
        console.log("START EXPORT PDF");

        browser =
            await puppeteer.launch({

                headless: true,

                args: [

                    "--no-sandbox",

                    "--disable-setuid-sandbox",

                    "--disable-dev-shm-usage",

                    "--disable-gpu"
                ]
            });

        const page =
            await browser.newPage();

        // OPEN WEBSITE
        await page.goto(
            "http://127.0.0.1:3000",
            {
                waitUntil:
                    "networkidle0",

                timeout: 60000
            }
        );

        // WAIT RENDER
        await new Promise(resolve =>
            setTimeout(resolve, 2000)
        );

        // HIDE TOOLBAR
        await page.evaluate(() => {

            const controls =
                document.querySelector(
                    ".controls"
                );

            if (controls) {

                controls.style.display =
                    "none";
            }
        });

        // GENERATE PDF
        const pdfBuffer =
            await page.pdf({

                format: "A4",

                printBackground: true,

                preferCSSPageSize: true,

                scale: 1,

                margin: {

                    top: "10mm",
                    bottom: "10mm",

                    left: "10mm",
                    right: "10mm"
                }
            });

        console.log(
            "PDF SIZE:",
            pdfBuffer.length
        );

        // VALIDATE PDF
        if (
            !pdfBuffer ||
            pdfBuffer.length < 1000
        ) {

            throw new Error(
                "PDF generation failed"
            );
        }

        // SEND PDF
        res.writeHead(200, {

            "Content-Type":
                "application/pdf",

            "Content-Disposition":
                "attachment; filename=report.pdf",

            "Content-Length":
                pdfBuffer.length
        });

        res.end(pdfBuffer);

    } catch (err) {

        console.error("");
        console.error("PDF ERROR");
        console.error(err);
        console.error("");

        res
        .status(500)
        .send("PDF Export Failed");

    } finally {

        if (browser) {

            await browser.close();
        }
    }
});


// =========================
// SOCKET
// =========================
io.on("connection", (socket) => {

    const machineName =

        socket.handshake.auth
        ?.machineName

        || "Unknown-PC";

    let ip =
        socket.handshake.address;

    ip =
        ip.replace("::ffff:", "");

    socket.machineInfo = {
        ip,
        machineName
    };

    console.log(
        socket.machineInfo.machineName + " " + socket.machineInfo.ip + " connected"
    );

    // LOCK CELL
    socket.on(
        "lockCell",
        (cellId) => {

            if (lockedCells[cellId]) {

                socket.emit(
                    "cellLocked",
                    cellId
                );

                return;
            }

            lockedCells[cellId] = true;

            socket.broadcast.emit(
                "cellLocked",
                cellId
            );
        }
    );

    // UNLOCK CELL
    socket.on(
        "unlockCell",
        (cellId) => {

            delete lockedCells[cellId];

            socket.broadcast.emit(
                "cellUnlocked",
                cellId
            );
        }
    );

    // TYPING
    socket.on(
        "typing",
        (cellId) => {

            socket.broadcast.emit(
                "typing",
                {

                    cellId,

                    ip:
                        socket.machineInfo.ip,

                    machineName:
                        socket.machineInfo.machineName
                }
            );
        }
    );

    // ADD ROW
    socket.on(
        "addRow",
        (data) => {

            socket.broadcast.emit(
                "rowAdded",
                data
            );
        }
    );

    // DELETE ROW
    socket.on(
        "deleteRow",
        (data) => {

            socket.broadcast.emit(
                "rowDeleted",
                data
            );
        }
    );

    // CLEAR TABLE
    socket.on(
        "clearTable",
        (data) => {

            socket.broadcast.emit(
                "tableCleared",
                data
            );
        }
    );

    socket.on(
        "disconnect",
        () => {

            console.log(
                socket.machineInfo.machineName + " " + socket.machineInfo.ip + " disconnected"
            );
        }
    );
});


// =========================
// START SERVER
// =========================
const PORT = 3000;

app.get(
    "/version",
    (req, res) => {

        res.json({

            version:
                SERVER_VERSION
        });
    }
);

app.use((req, res, next) => {

    res.setHeader(
        "Cache-Control",
        "no-store"
    );

    next();
});

server.listen(PORT, () => {

    console.log("");
    console.log("====================");
    console.log("DOR SERVER RUNNING");
    console.log("====================");
    console.log("");

    console.log(
        `http://127.0.0.1:${PORT}`
    );
});