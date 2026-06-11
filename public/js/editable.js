DOR.editable = {
    bindEditableCells() {
        document
            .querySelectorAll("[contenteditable]")
            .forEach(cell => {
                if (cell.dataset.bound) return;

                cell.dataset.bound = "1";

                cell.addEventListener("focus", () => {
                    const cellId = cell.dataset.cell;

                    if (!cellId) return;

                    DOR.socket.emit(
                        "lockCell",
                        cellId
                    );

                    DOR.socket.emit(
                        "typing",
                        cellId
                    );
                });

                cell.addEventListener("blur", async () => {
                    const cellId = cell.dataset.cell;
                    const headerKey = cell.dataset.header;

                    if (headerKey) {
                        if (!DOR.state.isHost) return;

                        await DOR.api.saveHeader(
                            headerKey,
                            cell.innerText
                        );

                        return;
                    }

                    if (!cellId) return;

                    await DOR.api.saveCell(
                        cellId,
                        cell.innerText
                    );

                    DOR.socket.emit(
                        "unlockCell",
                        cellId
                    );
                });

                cell.addEventListener("paste", async (e) => {

                    const cellId = cell.dataset.cell;
                
                    if (!cellId) return;
                
                    const text =
                        e.clipboardData.getData("text");
                
                    // chỉ xử lý multiline
                    if (!text.includes("\n")) {
                        return;
                    }
                
                    e.preventDefault();
                
                    const lines = text
                        .split(/\r?\n/)
                        .map(line => line.trim())
                        .filter(line => line);
                
                    if (!lines.length) return;
                
                    const parts = cellId.split("-");
                
                    const rowText = parts.pop();
                
                    const section =
                        parts.join("-");
                
                    const startRow =
                        Number(rowText);
                
                    const table = document.querySelector(
                        `table[data-section="${section}"]`
                    );
                
                    if (!table) return;
                
                    // auto add rows nếu thiếu
                    while (
                        table.rows.length - 1 <
                        startRow + lines.length - 1
                    ) {
                        const rowNumber =
                            table.rows.length;
                
                        const row =
                            table.insertRow();
                
                        row.innerHTML =
                            DOR.table.createRowHTML(
                                section,
                                rowNumber
                            );
                    }
                
                    DOR.editable.bindEditableCells();
                    DOR.table.bindTables();
                
                    // fill data
                    for (let i = 0; i < lines.length; i++) {
                
                        const rowNo =
                            startRow + i;
                
                        const targetCell =
                            document.querySelector(
                                `[data-cell="${section}-${rowNo}"]`
                            );
                
                        if (!targetCell) continue;
                
                        targetCell.innerText =
                            lines[i];
                
                        await DOR.api.saveCell(
                            `${section}-${rowNo}`,
                            lines[i]
                        );
                    }
                
                    // save new row count
                    await DOR.api.saveSectionRows(
                        section,
                        table.rows.length - 1
                    );
                });
            });
    }
};