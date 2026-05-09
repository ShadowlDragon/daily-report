const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const fs = require("fs");
const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);


// =========================
// MIDDLEWARE
// =========================
app.use(express.json({
    limit: "10mb"
}));

app.use(express.static("public"));


// =========================
// SHARED FOLDER
// =========================
const REPORT_FOLDER =
"\\\\srv-File-r8\\Group\\Electronic Technician\\Public\\Daily Operation Report"; //Shared file path


// =========================
// CREATE ROOT
// =========================
if (!fs.existsSync(REPORT_FOLDER)) {

    fs.mkdirSync(REPORT_FOLDER, {
        recursive: true
    });
}


// =========================
// LOCKED CELLS
// =========================
const lockedCells = {};


// =========================
// LOAD JSON
// =========================
function loadReportFile(date) {

    const dailyFolder =
        path.join(REPORT_FOLDER, date);

    const filePath =
        path.join(
            dailyFolder,
            "report.json"
        );

    // =====================
    // FILE EXISTS
    // =====================
    if (fs.existsSync(filePath)) {

        return JSON.parse(
            fs.readFileSync(filePath)
        );
    }

    // =====================
    // COPY PREVIOUS DAY
    // =====================
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

    // previous exists
    if (fs.existsSync(prevFile)) {

        console.log(
            `Cloning previous report: ${prevDateStr}`
        );

        const prevData =
            JSON.parse(
                fs.readFileSync(prevFile)
            );

        // auto create today folder
        fs.mkdirSync(
            dailyFolder,
            {
                recursive: true
            }
        );

        // auto save today
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

    // =====================
    // EMPTY
    // =====================
    return {};
}


// =========================
// SAVE JSON
// =========================
function saveReportFile(
    date,
    data
) {

    const dailyFolder =
        path.join(REPORT_FOLDER, date);

    if (!fs.existsSync(dailyFolder)) {

        fs.mkdirSync(dailyFolder, {
            recursive: true
        });
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
// SAVE CELL
// =========================
app.post("/saveCell", (req, res) => {

    try {

        const {
            date,
            cellId,
            value
        } = req.body;

        if (
            !date ||
            !cellId
        ) {

            return res
            .status(400)
            .send("Missing data");
        }

        let reportData =
            loadReportFile(date);

        reportData[cellId] = value;

        saveReportFile(
            date,
            reportData
        );

        // realtime update
        io.emit("cellUpdated", {
            cellId,
            value
        });

        console.log(
            `Saved: ${cellId}`
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
// LOAD REPORT
// =========================
app.get("/load/:date", (req, res) => {

    try {

        const date =
            req.params.date;

        const reportData =
            loadReportFile(date);

        res.json(reportData);

    } catch (err) {

        console.error(err);

        res
        .status(500)
        .send(err.message);
    }
});


// =========================
// SOCKET
// =========================
io.on("connection", (socket) => {

    console.log(
        "User connected"
    );


    // =====================
    // LOCK CELL
    // =====================
    socket.on("lockCell", (cellId) => {

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
    });


    // =====================
    // UNLOCK CELL
    // =====================
    socket.on("unlockCell", (cellId) => {

        delete lockedCells[cellId];

        socket.broadcast.emit(
            "cellUnlocked",
            cellId
        );
    });


    // =====================
    // ADD ROW
    // =====================
    socket.on("addRow", (data) => {

        socket.broadcast.emit(
            "rowAdded",
            data
        );
    });


    // =====================
    // DELETE ROW
    // =====================
    socket.on("deleteRow", (data) => {

        socket.broadcast.emit(
            "rowDeleted",
            data
        );
    });


    // =====================
    // CLEAR TABLE
    // =====================
    socket.on("clearTable", (data) => {

        socket.broadcast.emit(
            "tableCleared",
            data
        );
    });


    // =====================
    // TYPING
    // =====================
    socket.on("typing", (cellId) => {

        let ip =
            socket.handshake.address;

        ip = ip.replace(
            "::ffff:",
            ""
        );

        socket.broadcast.emit(
            "typing",
            {
                cellId,
                ip
            }
        );
    });


    // =====================
    // DISCONNECT
    // =====================
    socket.on("disconnect", () => {

        console.log(
            "User disconnected"
        );
    });
});


// =========================
// START SERVER
// =========================
const PORT = 3000;

server.listen(PORT, () => {

    console.log("");
    console.log("=======================");
    console.log("DOR SERVER RUNNING");
    console.log("=======================");
    console.log("");

    console.log(
        `http://localhost:${PORT}`
    );

    console.log("");
});