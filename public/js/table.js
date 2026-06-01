DOR.table = {
    createRowHTML(section, rowNumber) {
        return `
            <td class="no" style="text-align:center">
                ${rowNumber}
            </td>

            <td
                contenteditable="true"
                data-cell="${section}-${rowNumber}">
            </td>
        `;
    },

    init(reportData = {}) {
        const dateCell = document.getElementById("date");

        if (dateCell) {
            dateCell.innerText = DOR.dateUtils.getDisplayToday();
        }

        document
            .querySelectorAll(".section-block")
            .forEach(el => el.remove());

        const container = document.getElementById("report");

        if (!container) return;

        const savedRows = {};

        if (Array.isArray(reportData.sections)) {
            reportData.sections.forEach(section => {
                savedRows[section.name] = section.rows.length;
            });
        }

        DOR.config.sections.forEach(name => {
            const title = document.createElement("div");
            title.className = "section-title";
            title.innerText = name;

            const table = document.createElement("table");
            table.dataset.section = name;

            table.innerHTML = `
                <tr>
                    <th style="width:50px">No.</th>
                    <th>Current Activity / Work Done</th>
                </tr>
            `;

            const rowCount =
                savedRows[name] !== undefined
                    ? Number(savedRows[name])
                    : DOR.config.defaultRowCount;

            for (let i = 1; i <= rowCount; i++) {
                const row = table.insertRow();

                row.innerHTML = DOR.table.createRowHTML(
                    name,
                    i
                );
            }

            const block = document.createElement("div");
            block.className = "section-block";

            block.appendChild(title);
            block.appendChild(table);

            container.appendChild(block);
        });

        DOR.rig.applyRigName(
            DOR.state.currentRigName
        );

        DOR.table.bindTables();
        DOR.editable.bindEditableCells();
    },

    applyReportData(data) {
        if (data.header) {
            Object.keys(data.header).forEach(key => {
                const cell = document.querySelector(
                    `[data-header="${key}"]`
                );

                if (cell) {
                    cell.innerText = data.header[key] || "";
                }
            });
        }

        if (Array.isArray(data.sections)) {
            data.sections.forEach(section => {
                section.rows.forEach(row => {
                    const cell = document.querySelector(
                        `[data-cell="${section.name}-${row.no}"]`
                    );

                    if (!cell) return;

                    cell.innerText = row.value || "";
                });
            });

            DOR.rig.applyRigName(
                DOR.state.currentRigName
            );

            return;
        }

        Object.keys(data).forEach(cellId => {
            if (cellId === "__rows__") return;

            const cell = document.querySelector(
                `[data-cell="${cellId}"]`
            );

            if (!cell) return;

            cell.innerText = data[cellId];
        });

        DOR.rig.applyRigName(
            DOR.state.currentRigName
        );
    },

    bindTables() {
        document
            .querySelectorAll("table[data-section]")
            .forEach(table => {
                table.onclick = (e) => {
                    e.stopPropagation();

                    DOR.state.currentTable = table;

                    const controls = document.querySelector(".controls");

                    if (controls) {
                        controls.classList.add("active");
                    }
                };
            });
    },

    initControls() {
        document.addEventListener("click", (e) => {
            if (
                !e.target.closest("table[data-section]") &&
                !e.target.closest(".controls")
            ) {
                const controls = document.querySelector(".controls");

                if (controls) {
                    controls.classList.remove("active");
                }

                DOR.state.currentTable = null;
            }
        });

        const controls = document.querySelector(".controls");

        if (controls) {
            controls.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        }
    },

    async addRow() {
        const table = DOR.state.currentTable;

        if (!table) return;

        const section = table.dataset.section;
        const rowNumber = table.rows.length;

        const row = table.insertRow();

        row.innerHTML = DOR.table.createRowHTML(
            section,
            rowNumber
        );

        DOR.editable.bindEditableCells();

        await DOR.api.saveSectionRows(
            section,
            table.rows.length - 1
        );

        DOR.socket.emit("addRow", {
            section
        });
    },

    async deleteRow() {
        const table = DOR.state.currentTable;
    
        if (!table) return;
    
        // table có 1 header row, nên <= 2 nghĩa là còn 1 data row
        if (table.rows.length <= 2) return;
    
        const section = table.dataset.section;
    
        table.deleteRow(
            table.rows.length - 1
        );
    
        await DOR.api.saveSectionRows(
            section,
            table.rows.length - 1
        );
    
        DOR.socket.emit("deleteRow", {
            section
        });
    },

    async clearTable() {
        const table = DOR.state.currentTable;

        if (!table) return;

        const section = table.dataset.section;
        const rows = table.querySelectorAll("tr");

        for (let i = 1; i < rows.length; i++) {
            const cell = rows[i].cells[1];

            cell.innerText = "";

            const cellId = `${section}-${i}`;

            await DOR.api.saveCell(
                cellId,
                ""
            );
        }

        DOR.socket.emit("clearTable", {
            section
        });
    }
};

window.addRow = DOR.table.addRow;
window.deleteRow = DOR.table.deleteRow;
window.clearTable = DOR.table.clearTable;