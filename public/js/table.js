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
    
                    const floatingTools =
                        document.getElementById("floatingTools");
    
                    if (floatingTools) {
                        floatingTools.classList.add("collapsed");
                    }
    
                    DOR.state.currentTable = table;
    
                    const controls =
                        document.querySelector(".controls");
    
                    if (controls) {
                        controls.classList.add("active");
                    }
                };
    
                table
                    .querySelectorAll("tr")
                    .forEach((row, index) => {
    
                        // bỏ qua header row
                        if (index === 0) return;

                        if (row.dataset.rowBound) return;

                        row.dataset.rowBound = "1";
    
                        row.onclick = (e) => {
                            e.stopPropagation();
    
                            DOR.state.currentTable = table;
    
                            DOR.table.selectRow(row);
    
                            const controls =
                                document.querySelector(".controls");
    
                            if (controls) {
                                controls.classList.add("active");
                            }
    
                            const floatingTools =
                                document.getElementById("floatingTools");
    
                            if (floatingTools) {
                                floatingTools.classList.add("collapsed");
                            }
                        };
                    });

                document.addEventListener("click", (e) => {

                    const insideTable =
                        e.target.closest(
                            "table[data-section]"
                        );
                
                    const insideControls =
                        e.target.closest(
                            ".controls"
                        );
                
                    if (
                        !insideTable &&
                        !insideControls
                    ) {
                        DOR.table.clearSelectedRow();
                    }
                });
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

    selectRow(row) {
        document
            .querySelectorAll("tr.selected-row")
            .forEach(item => {
                item.classList.remove("selected-row");
            });
    
        row.classList.add("selected-row");
    
        DOR.state.selectedRow = row;
    },
    
    renumberTable(table) {
        const section = table.dataset.section;
        const rows = table.querySelectorAll("tr");
    
        let no = 1;
    
        rows.forEach((row, index) => {
            if (index === 0) return;
    
            row.cells[0].innerText = no;
    
            const cell = row.cells[1];
    
            cell.dataset.cell = `${section}-${no}`;
    
            no++;
        });
    },
    
    async saveWholeSection(table) {
        const section = table.dataset.section;
        const rows = table.querySelectorAll("tr");
    
        await DOR.api.saveSectionRows(
            section,
            rows.length - 1
        );
    
        for (let i = 1; i < rows.length; i++) {
            const value =
                rows[i].cells[1].innerText.trim();
    
            await DOR.api.saveCell(
                `${section}-${i}`,
                value
            );
        }
    },

    async addRow() {
        let table = DOR.state.currentTable;
    
        if (!table) {
            DOR.toast.show(
                "Select a section first",
                "warning"
            );
            return;
        }
    
        const section = table.dataset.section;
    
        let insertIndex;
    
        if (DOR.state.selectedRow) {
            insertIndex =
                DOR.state.selectedRow.rowIndex + 1;
        } else {
            // nếu chưa chọn row thì add cuối bảng như cũ
            insertIndex = table.rows.length;
        }
    
        const row = table.insertRow(insertIndex);
    
        row.innerHTML = DOR.table.createRowHTML(
            section,
            insertIndex
        );
    
        DOR.table.renumberTable(table);
    
        DOR.editable.bindEditableCells();
        DOR.table.bindTables();
    
        await DOR.table.saveWholeSection(table);
    
        DOR.table.selectRow(row);
    
        DOR.socket.emit("sectionReload", {
            section
        });
    
        DOR.toast.show(
            "Row added",
            "success"
        );
    },

    async deleteRow() {
        const selectedRow = DOR.state.selectedRow;

        if (!selectedRow) {
            DOR.toast.show(
                "Select a row first",
                "warning"
            );
            return;
        }

        const table = selectedRow.closest("table");

        if (!table) return;

        if (table.rows.length <= 2) {
            DOR.toast.show(
                "Cannot delete the last row",
                "warning"
            );
            return;
        }

        const section = table.dataset.section;

        const deletedRowIndex = selectedRow.rowIndex;

        selectedRow.remove();

        DOR.table.renumberTable(table);

        await DOR.table.saveWholeSection(table);

        DOR.editable.bindEditableCells();
        DOR.table.bindTables();

        let nextRow =
            table.rows[deletedRowIndex] ||
            table.rows[deletedRowIndex - 1];

        if (nextRow && nextRow.rowIndex !== 0) {
            DOR.table.selectRow(nextRow);
            DOR.state.currentTable = table;
        } else {
            DOR.state.selectedRow = null;
        }

        DOR.socket.emit("sectionReload", {
            section
        });

        DOR.toast.show(
            "Row deleted",
            "success"
        );
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

        DOR.toast.show(
            "Table cleared",
            "success"
        );
    },

    async copyCurrentSection() {
        const table = DOR.state.currentTable;
    
        if (!table) {
            DOR.toast.show(
                "Select a section first",
                "warning"
            );
            return;
        }
    
        const lines = [];
    
        for (let i = 1; i < table.rows.length; i++) {
            const value = table.rows[i].cells[1].innerText.trim();
    
            if (value) {
                lines.push(value);
            }
        }
    
        await navigator.clipboard.writeText(
            lines.join("\n")
        );
    
        DOR.toast.show("Copied", "success");
    },

    clearSelectedRow() {

        document
            .querySelectorAll("tr.selected-row")
            .forEach(row => {
                row.classList.remove(
                    "selected-row"
                );
            });
    
        const controls =
            document.querySelector(
                ".controls"
            );
    
        if (controls) {
            controls.classList.remove(
                "active"
            );
        }
    
        DOR.state.selectedRow = null;
    },
};

window.addRow = DOR.table.addRow;
window.deleteRow = DOR.table.deleteRow;
window.clearTable = DOR.table.clearTable;
window.copyCurrentSection = DOR.table.copyCurrentSection;
