const fs = require("fs");
const path = require("path");

process.env.PUPPETEER_CACHE_DIR = path.join(
    __dirname,
    "..",
    ".cache",
    "puppeteer"
);

const puppeteer = require("puppeteer");

const {
    PORT
} = require("./constants");

const {
    getConfig
} = require("./configService");

const {
    ensureDailyFolder
} = require("./reportService");

const {
    getToday
} = require("./utils/date");

const {
    writeErrorLog
} = require("./loggerService");

async function generatePDFBuffer(sourceName = "Unknown-PC", sections = "All") {
    let browser;

    try {
        console.log("");
        console.log("START EXPORT PDF");
        console.log("Source:", sourceName);

        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ]
        });

        const page = await browser.newPage();

        await page.setRequestInterception(true);

        page.on("request", req => {
            const url = req.url();

            if (
                url.startsWith(`http://127.0.0.1:${PORT}`) ||
                url.startsWith("data:") ||
                url.startsWith("blob:")
            ) {
                req.continue();
                return;
            }

            req.abort();

        await page.evaluateOnNewDocument(() => {
            localStorage.setItem(
                "machineName",
                "PDF-Exporter"
            );
        });

        await page.goto(
            `http://127.0.0.1:${PORT}`,
            {
                waitUntil: "domcontentloaded",
                timeout: 0
            }
        );

        await new Promise(resolve =>
            setTimeout(resolve, 2000)
        );

        const selectedSections =
            sections === "All"
                ? []
                : sections.split(",").map(item => item.trim());

        await page.evaluate((selectedSections) => {
            const hideSelectors = [
                ".controls",
                "#floatingTools",
                "#settingsBtn",
                "#folderSettingBtn",
                "#quickPdfBtn",
                "#settingsModal",
                "#storageModal",
                "#pdfExportModal",
                "#loadingScreen",
                ".typing-overlay"
            ];

            hideSelectors.forEach(selector => {
                document
                    .querySelectorAll(selector)
                    .forEach(el => {
                        el.style.display = "none";
                        el.classList.remove("active");
                    });
            });

            if (selectedSections.length) {
                document
                    .querySelectorAll(".section-block")
                    .forEach(block => {
                        const title =
                            block
                                .querySelector(".section-title")
                                ?.innerText
                                ?.trim();

                        if (!selectedSections.includes(title)) {
                            block.style.display = "none";
                        }
                    });
            }

            document.body.style.filter = "none";
            document.documentElement.style.filter = "none";
        }, selectedSections);

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
                        el.style.display = "none";
                        el.classList.remove("active");
                    });
            });

            document.body.style.filter = "none";
            document.documentElement.style.filter = "none";
        });

        const pdfData = await page.pdf({
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

        const pdfBuffer = Buffer.from(pdfData);

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

    } catch (err) {
        writeErrorLog(
            "PDF GENERATION ERROR",
            err,
            {
                sourceName
            }
        );

        throw err;

    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function saveAutoPDF() {
    try {
        const config = getConfig();

        if (!config.reportFolder) {
            console.log(
                "AUTO PDF SKIPPED: REPORT_FOLDER is not configured"
            );

            return null;
        }

        const date = getToday();

        const dailyFolder = ensureDailyFolder(date);

        const pdfBuffer = await generatePDFBuffer(
            "AUTO-3PM"
        );

        const fileName = `DOR-${date}.pdf`;

        const pdfPath = path.join(
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

        return pdfPath;

    } catch (err) {
        writeErrorLog(
            "AUTO PDF SAVE ERROR",
            err
        );

        throw err;
    }
}

module.exports = {
    generatePDFBuffer,
    saveAutoPDF
};