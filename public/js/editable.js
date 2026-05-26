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
            });
    }
};