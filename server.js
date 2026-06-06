// =========================
// SERVER.JS
// =========================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const configRoutes = require("./src/routes/configRoutes");
const createReportRoutes = require("./src/routes/reportRoutes");
const pdfRoutes = require("./src/routes/pdfRoutes");
const setupSocket = require("./src/socketService");

const {
    startScheduler
} = require("./src/scheduler");

const {
    PORT
} = require("./src/constants");

const {
    getConfig
} = require("./src/configService");

const {
    getLocalIP
} = require("./src/utils/network");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const SERVER_VERSION = Date.now().toString();


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
// ROUTES
// =========================

app.use("/config", configRoutes);

app.use("/", createReportRoutes(io));

app.use("/", pdfRoutes);

app.get("/version", (req, res) => {
    res.json({
        version: SERVER_VERSION
    });
});


// =========================
// SOCKET
// =========================

setupSocket(io);


// =========================
// SCHEDULER
// =========================

startScheduler();

// =========================
// ERROR LOG
// =========================

const {
    writeErrorLog
} = require("./src/loggerService");

process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION");
    console.error(err);

    writeErrorLog(
        "UNCAUGHT EXCEPTION",
        err
    );
});

process.on("unhandledRejection", (reason) => {
    console.error("UNHANDLED REJECTION");
    console.error(reason);

    writeErrorLog(
        "UNHANDLED REJECTION",
        reason
    );
});


// =========================
// START SERVER
// =========================

server.listen(
    PORT,
    "0.0.0.0",
    () => {
        const ip = getLocalIP();

        const localUrl = `http://127.0.0.1:${PORT}`;
        const lanUrl = `http://${ip}:${PORT}`;

        const config = getConfig();

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
            config.reportFolder ||
            "NOT CONFIGURED YET"
        );

        console.log("");

        console.log("AUTO PDF:");
        console.log("Enabled daily at 15:00");

        console.log("");
    }
);