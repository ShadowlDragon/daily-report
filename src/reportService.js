const fs = require("fs");
const path = require("path");

const {
    DEFAULT_SECTIONS,
    DEFAULT_ROW_COUNT
} = require("./constants");

const {
    getConfig
} = require("./configService");

function createEmptyReport(date) {
    return {
        date,
        header: {
            TotalPOB: "",
            Operator: "",
            CurrentActivities: ""
        },
        sections: DEFAULT_SECTIONS.map(section => ({
            name: section,
            rows: Array.from(
                { length: DEFAULT_ROW_COUNT },
                (_, index) => ({
                    no: index + 1,
                    value: ""
                })
            )
        }))
    };
}

function getSection(reportData, sectionName) {
    let section = reportData.sections.find(item =>
        item.name === sectionName
    );

    if (!section) {
        section = {
            name: sectionName,
            rows: Array.from(
                { length: DEFAULT_ROW_COUNT },
                (_, index) => ({
                    no: index + 1,
                    value: ""
                })
            )
        };

        reportData.sections.push(section);
    }

    return section;
}

function normalizeReportData(date, rawData = {}) {
    if (
        rawData &&
        Array.isArray(rawData.sections)
    ) {
        return rawData;
    }

    const reportData = createEmptyReport(date);

    reportData.header = {
        TotalPOB:
            rawData.header?.TotalPOB ||
            rawData.TotalPOB ||
            "",

        Operator:
            rawData.header?.Operator ||
            rawData.Operator ||
            "",

        CurrentActivities:
            rawData.header?.CurrentActivities ||
            rawData.CurrentActivities ||
            ""
    };

    const rowCounts = rawData.__rows__ || {};

    DEFAULT_SECTIONS.forEach(sectionName => {
        const section = getSection(reportData, sectionName);

        const rowCount = Math.max(
            DEFAULT_ROW_COUNT,
            Number(rowCounts[sectionName]) || DEFAULT_ROW_COUNT
        );

        section.rows = Array.from(
            { length: rowCount },
            (_, index) => ({
                no: index + 1,
                value:
                    rawData[`${sectionName}-${index + 1}`] ||
                    ""
            })
        );
    });

    return reportData;
}

function getDailyFolder(date) {
    const { reportFolder } = getConfig();

    return path.join(
        reportFolder,
        date
    );
}

function ensureDailyFolder(date) {
    const dailyFolder = getDailyFolder(date);

    if (!fs.existsSync(dailyFolder)) {
        fs.mkdirSync(dailyFolder, {
            recursive: true
        });
    }

    return dailyFolder;
}

function saveReportFile(date, data) {
    const dailyFolder = ensureDailyFolder(date);

    const filePath = path.join(
        dailyFolder,
        "report.json"
    );

    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 2)
    );
}

function loadReportFile(date) {
    const { reportFolder } = getConfig();

    if (!reportFolder) {
        return {};
    }

    const dailyFolder = path.join(reportFolder, date);

    const filePath = path.join(
        dailyFolder,
        "report.json"
    );

    if (fs.existsSync(filePath)) {
        const rawData = JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

        const normalized = normalizeReportData(
            date,
            rawData
        );

        saveReportFile(date, normalized);

        return normalized;
    }

    const previousDate = new Date(date);

    previousDate.setDate(
        previousDate.getDate() - 1
    );

    const prevDateStr = previousDate
        .toISOString()
        .split("T")[0];

    const prevFile = path.join(
        reportFolder,
        prevDateStr,
        "report.json"
    );

    if (fs.existsSync(prevFile)) {
        const prevData = JSON.parse(
            fs.readFileSync(prevFile, "utf8")
        );

        fs.mkdirSync(dailyFolder, {
            recursive: true
        });

        fs.writeFileSync(
            filePath,
            JSON.stringify(prevData, null, 2)
        );

        const normalized = normalizeReportData(
            date,
            prevData
        );

        saveReportFile(date, normalized);

        return normalized;
    }

    const emptyReport = createEmptyReport(date);

    saveReportFile(date, emptyReport);

    return emptyReport;
}

function updateHeader(date, key, value) {
    const allowedKeys = [
        "TotalPOB",
        "Operator",
        "CurrentActivities"
    ];

    if (!allowedKeys.includes(key)) {
        throw new Error("Invalid header key");
    }

    const reportData = loadReportFile(date);

    if (!reportData.header) {
        reportData.header = {};
    }

    reportData.header[key] = value;

    saveReportFile(date, reportData);

    return reportData;
}

function updateRowCount(date, sectionName, rowCount) {
    const reportData = loadReportFile(date);

    const sectionData = getSection(
        reportData,
        sectionName
    );

    while (sectionData.rows.length < rowCount) {
        sectionData.rows.push({
            no: sectionData.rows.length + 1,
            value: ""
        });
    }

    if (sectionData.rows.length > rowCount) {
        sectionData.rows = sectionData.rows.slice(
            0,
            rowCount
        );
    }

    sectionData.rows = sectionData.rows.map((row, index) => ({
        no: index + 1,
        value: row.value || ""
    }));

    saveReportFile(date, reportData);

    return reportData;
}

function updateCell(date, cellId, value) {
    const reportData = loadReportFile(date);

    const parts = cellId.split("-");

    if (parts.length < 2) {
        throw new Error("Invalid cell id");
    }

    const rowText = parts.pop();

    const sectionName = parts.join("-");

    const rowNo = Number(rowText);

    if (
        !sectionName ||
        !Number.isInteger(rowNo) ||
        rowNo < 1
    ) {
        throw new Error("Invalid row number");
    }

    const section = getSection(
        reportData,
        sectionName
    );

    while (section.rows.length < rowNo) {
        section.rows.push({
            no: section.rows.length + 1,
            value: ""
        });
    }

    section.rows[rowNo - 1].value = value;

    saveReportFile(date, reportData);

    return reportData;
}

module.exports = {
    createEmptyReport,
    getSection,
    normalizeReportData,
    getDailyFolder,
    ensureDailyFolder,
    loadReportFile,
    saveReportFile,
    updateHeader,
    updateRowCount,
    updateCell
};