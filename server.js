// =========================
// SERVER.JS
// =========================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const os = require("os");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const schedule = require("node-schedule");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const PORT = 3000;

const SERVER_VERSION =
    Date.now().toString();


// =========================
// CONFIG
// =========================

const CONFIG_PATH =
    path.join(__dirname, "config.json");

let REPORT_FOLDER = "";

function isLocalRequest(req) {

    const ip =
        req.ip ||
        req.connection.remoteAddress ||
        "";

    return (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip === "::ffff:127.0.0.1"
    );
}

function loadConfig() {

    if (!fs.existsSync(CONFIG_PATH)) {

        REPORT_FOLDER = "";
        return;
    }

    try {

        const config =
            JSON.parse(
                fs.readFileSync(
                    CONFIG_PATH,
                    "utf8"
                )
            );

        REPORT_FOLDER =
            config.reportFolder || "";

    } catch (err) {

        console.error("CONFIG LOAD ERROR:");
        console.error(err);

        REPORT_FOLDER = "";
    }
}

function saveConfig(folder) {

    REPORT_FOLDER = folder;

    if (!fs.existsSync(REPORT_FOLDER)) {

        fs.mkdirSync(
            REPORT_FOLDER,
            {
                recursive: true
            }
        );
    }

    fs.writeFileSync(
        CONFIG_PATH,
        JSON.stringify(
            {
                reportFolder:
                    REPORT_FOLDER
            },
            null,
            2
        )
    );
}

loadConfig();


// =========================
// HELPERS
// =========================

function getLocalIP() {

    const interfaces =
        os.networkInterfaces();

    const candidates = [];

    for (const name in interfaces) {

        for (const iface of interfaces[name]) {

            if (
                iface.family === "IPv4" &&
                !iface.internal
            ) {

                candidates.push({
                    name,
                    address: iface.address
                });
            }
        }
    }

    const filtered =
        candidates.filter(item =>
            item.address !== "192.168.137.1"
        );

    const wifi =
        filtered.find(item =>
            item.name.toLowerCase().includes("wi-fi") ||
            item.name.toLowerCase().includes("wireless")
        );

    if (wifi) {
        return wifi.address;
    }

    const lan =
        filtered.find(item =>
            item.address.startsWith("192.168.") ||
            item.address.startsWith("172.") ||
            item.address.startsWith("10.")
        );

    if (lan) {
        return lan.address;
    }

    return "127.0.0.1";
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

function getToday() {

    const today = new Date();

    return (
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0")
    );
}

function getTimeStamp() {

    const now = new Date();

    return (
        String(now.getHours()).padStart(2, "0") + "-" +
        String(now.getMinutes()).padStart(2, "0")
    );
}

function getDailyFolder(date) {

    return path.join(
        REPORT_FOLDER,
        date
    );
}

function ensureDailyFolder(date) {

    const dailyFolder =
        getDailyFolder(date);

    if (!fs.existsSync(dailyFolder)) {

        fs.mkdirSync(
            dailyFolder,
            {
                recursive: true
            }
        );
    }

    return dailyFolder;
}


// =========================
// MIDDLEWARE
// =========================

app.use((req, res, next) => {

    res.setHeader(
        "Cache-Control",
        "no-store"
    );

    next();
});

app.use(express.json({
    limit: "50mb"
}));

app.use(express.static("public"));


// =========================
// CONFIG API
// =========================

app.get("/config", (req, res) => {

    res.json({

        hasConfig:
            !!REPORT_FOLDER,

        reportFolder:
            REPORT_FOLDER,

        isHost:
            isLocalRequest(req)
    });
});

app.post("/config", (req, res) => {

    if (!isLocalRequest(req)) {

        return res
            .status(403)
            .send(
                "Only server host can change report folder"
            );
    }

    const {
        reportFolder
    } = req.body;

    if (!reportFolder) {

        return res
            .status(400)
            .send("Missing report folder");
    }

    try {

        saveConfig(reportFolder);

        res.send("saved");

    } catch (err) {

        console.error(err);

        res
            .status(500)
            .send(err.message);
    }
});


// =========================
// VERSION API
// =========================

app.get("/version", (req, res) => {

    res.json({
        version:
            SERVER_VERSION
    });
});


// =========================
// LOCKED CELLS
// =========================

const lockedCells = {};
const cellOwners = {};


// =========================
// LOAD REPORT FILE
// =========================

function loadReportFile(date) {

    if (!REPORT_FOLDER) {
        return {};
    }

    const dailyFolder =
        path.join(REPORT_FOLDER, date);

    const filePath =
        path.join(
            dailyFolder,
            "report.json"
        );

    if (fs.existsSync(filePath)) {

        return JSON.parse(
            fs.readFileSync(
                filePath,
                "utf8"
            )
        );
    }

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
                fs.readFileSync(
                    prevFile,
                    "utf8"
                )
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

function saveReportFile(date, data) {

    const dailyFolder =
        ensureDailyFolder(date);

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

        if (!REPORT_FOLDER) {
            return res.json({});
        }

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
// SAVE ROWS
// =========================

app.post("/saveRows", (req, res) => {

    try {

        if (!ensureConfigured(res))
            return;

        const {
            date,
            section,
            rowCount
        } = req.body;

        const reportData =
            loadReportFile(date);

        if (!reportData.__rows__) {
            reportData.__rows__ = {};
        }

        reportData.__rows__[section] =
            rowCount;

        saveReportFile(
            date,
            reportData
        );

        res.send("saved");

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

        if (!ensureConfigured(res))
            return;

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
// PDF GENERATOR
// =========================

async function generatePDFBuffer(sourceName = "Unknown-PC") {

    let browser;

    try {

        console.log("");
        console.log("START EXPORT PDF");
        console.log("Source:", sourceName);

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

        await page.evaluateOnNewDocument(() => {

            localStorage.setItem(
                "machineName",
                "PDF-Exporter"
            );
        });

        await page.goto(
            `http://127.0.0.1:${PORT}`,
            {
                waitUntil:
                    "networkidle0",

                timeout:
                    60000
            }
        );

        await new Promise(resolve =>
            setTimeout(resolve, 2000)
        );

        await page.evaluate(() => {

            const hideSelectors = [
                ".controls",
                "#floatingTools",
                "#settingsBtn",
                "#folderSettingBtn",
                "#quickPdfBtn",
                "#settingsModal",
                "#storageModal",
                "#loadingScreen",
                ".typing-overlay"
            ];

            hideSelectors.forEach(selector => {

                document
                    .querySelectorAll(selector)
                    .forEach(el => {

                        el.style.display =
                            "none";

                        el.classList.remove(
                            "active"
                        );
                    });
            });

            document.body.style.filter =
                "none";

            document.documentElement.style.filter =
                "none";
        });

        const pdfData =
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

        const pdfBuffer =
            Buffer.from(pdfData);

        console.log(
            "PDF SIZE:",
            pdfBuffer.length
        );

        if (
            !pdfBuffer ||
            pdfBuffer.length < 1000
        ) {

            throw new Error(
                "PDF generation failed"
            );
        }

        return pdfBuffer;

    } finally {

        if (browser) {

            await browser.close();
        }
    }
}

async function saveAutoPDF() {

    try {

        if (!REPORT_FOLDER) {

            console.log(
                "AUTO PDF SKIPPED: REPORT_FOLDER is not configured"
            );

            return;
        }

        const date =
            getToday();

        const dailyFolder =
            ensureDailyFolder(date);

        const pdfBuffer =
            await generatePDFBuffer(
                "AUTO-6PM"
            );

        const fileName =
            `DOR-${date}-${getTimeStamp()}.pdf`;

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
        console.log("================================");
        console.log("AUTO PDF SAVED");
        console.log("================================");
        console.log(pdfPath);
        console.log("");

    } catch (err) {

        console.error("");
        console.error("AUTO PDF ERROR");
        console.error(err);
        console.error("");
    }
}


// =========================
// EXPORT PDF API
// =========================

app.get("/exportPDF", async (req, res) => {

    const ip =
        (req.ip || "")
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

        if (!ensureConfigured(res))
            return;

        const pdfBuffer =
            await generatePDFBuffer(
                machineName
            );

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
    }
});


// =========================
// SCHEDULE AUTO PDF 6PM
// =========================

schedule.scheduleJob(
    "0 18 * * *",
    async () => {

        console.log("");
        console.log("================================");
        console.log("6PM AUTO PDF EXPORT");
        console.log("================================");
        console.log("");

        await saveAutoPDF();
    }
);


// =========================
// SOCKET
// =========================

io.on("connection", (socket) => {

    const machineName =
        socket.handshake.auth
            ?.machineName ||
        "Unknown-PC";

    let ip =
        socket.handshake.address;

    ip =
        ip.replace("::ffff:", "");

    socket.machineInfo = {
        ip,
        machineName
    };

    console.log(
        `${machineName} ${ip} connected`
    );

    socket.on("lockCell", (cellId) => {

        if (lockedCells[cellId]) {

            socket.emit(
                "cellLocked",
                cellId
            );

            return;
        }

        lockedCells[cellId] = true;

        cellOwners[cellId] =
            socket.id;

        socket.broadcast.emit(
            "cellLocked",
            cellId
        );
    });

    socket.on("unlockCell", (cellId) => {

        delete lockedCells[cellId];

        delete cellOwners[cellId];

        socket.broadcast.emit(
            "cellUnlocked",
            cellId
        );
    });

    socket.on("typing", (cellId) => {

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
    });

    socket.on("addRow", (data) => {

        socket.broadcast.emit(
            "rowAdded",
            data
        );
    });

    socket.on("deleteRow", (data) => {

        socket.broadcast.emit(
            "rowDeleted",
            data
        );
    });

    socket.on("clearTable", (data) => {

        socket.broadcast.emit(
            "tableCleared",
            data
        );
    });

    socket.on("disconnect", () => {

        console.log(
            `${machineName} ${ip} disconnected`
        );

        for (const cellId in cellOwners) {

            if (
                cellOwners[cellId] ===
                socket.id
            ) {

                delete lockedCells[cellId];

                delete cellOwners[cellId];

                socket.broadcast.emit(
                    "cellUnlocked",
                    cellId
                );
            }
        }
    });
});


// =========================
// START SERVER
// =========================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        const ip =
            getLocalIP();

        const localUrl =
            `http://127.0.0.1:${PORT}`;

        const lanUrl =
            `http://${ip}:${PORT}`;

        console.clear();

        console.log("");
        console.log("==================================");
        console.log("      DOR SERVER RUNNING");
        console.log("==================================");
        console.log("");

        console.log("THIS PC:");
        console.log(localUrl);

        console.log("");

        console.log("OTHER PCs USE:");
        console.log(lanUrl);

        console.log("");

        console.log("REPORT FOLDER:");

        console.log(
            REPORT_FOLDER ||
            "NOT CONFIGURED YET"
        );

        console.log("");
        console.log("AUTO PDF:");
        console.log("Enabled daily at 18:00");
        console.log("");
    }
);
