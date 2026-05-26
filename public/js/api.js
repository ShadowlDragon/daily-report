DOR.api = {
    async loadReportData() {
        const date = DOR.dateUtils.getToday();

        const res = await fetch(`/load/${date}`);

        if (!res.ok) {
            console.error(await res.text());
            return {};
        }

        return await res.json();
    },

    async saveCell(cellId, value) {
        if (cellId === "RigName") return;

        const date = DOR.dateUtils.getToday();

        const res = await fetch("/saveCell", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                date,
                cellId,
                value
            })
        });

        if (!res.ok) {
            console.error(
                "SAVE CELL FAILED:",
                cellId,
                await res.text()
            );
        }
    },

    async saveHeader(key, value) {
        const date = DOR.dateUtils.getToday();

        const res = await fetch("/saveHeader", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                date,
                key,
                value
            })
        });

        if (!res.ok) {
            console.error(
                "SAVE HEADER FAILED:",
                key,
                await res.text()
            );
        }
    },

    async saveSectionRows(section, rowCount) {
        const date = DOR.dateUtils.getToday();

        const res = await fetch("/saveRows", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                date,
                section,
                rowCount
            })
        });

        if (!res.ok) {
            console.error(
                "SAVE ROWS FAILED:",
                await res.text()
            );
        }
    },

    async getConfig() {
        const res = await fetch("/config");
        return await res.json();
    },

    async saveConfig(reportFolder, rigName) {
        return await fetch("/config", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                reportFolder,
                rigName
            })
        });
    }
};