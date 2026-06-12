DOR.socketClient = {
    init() {
        DOR.socket = io({
            auth: {
                machineName:
                    DOR.state.machineName ||
                    "Unknown-PC"
            }
        });

        DOR.socketClient.bindEvents();
    },

    bindEvents() {
        DOR.socket.on("cellUpdated", (data) => {
            const cell = document.querySelector(
                `[data-cell="${data.cellId}"]`
            );

            if (!cell) return;

            if (data.cellId === "RigName") {
                DOR.rig.applyRigName(
                    DOR.state.currentRigName
                );

                return;
            }

            if (document.activeElement === cell) return;

            const overlay = cell.querySelector(
                ".typing-overlay"
            );

            cell.innerText = data.value;

            if (overlay) {
                cell.appendChild(overlay);
            }
        });

        DOR.socket.on("headerUpdated", (data) => {
            const cell = document.querySelector(
                `[data-header="${data.key}"]`
            );

            if (!cell) return;

            if (document.activeElement === cell) return;

            cell.innerText = data.value || "";
        });

        DOR.socket.on("cellLocked", (cellId) => {
            const cell = document.querySelector(
                `[data-cell="${cellId}"]`
            );

            if (!cell) return;

            if (document.activeElement === cell) return;

            cell.setAttribute(
                "contenteditable",
                "false"
            );

            cell.style.background = "#ffe4e4";
        });

        DOR.socket.on("cellUnlocked", (cellId) => {
            const cell = document.querySelector(
                `[data-cell="${cellId}"]`
            );

            if (!cell) return;

            cell.setAttribute(
                "contenteditable",
                "true"
            );

            cell.style.background = "white";

            const overlay = cell.querySelector(
                ".typing-overlay"
            );

            if (overlay) {
                overlay.remove();
            }
        });

        DOR.socket.on("typing", (data) => {
            const cell = document.querySelector(
                `[data-cell="${data.cellId}"]`
            );

            if (!cell) return;

            if (document.activeElement === cell) return;

            const old = cell.querySelector(
                ".typing-overlay"
            );

            if (old) {
                old.remove();
            }

            const overlay = document.createElement("div");
            overlay.className = "typing-overlay";

            overlay.innerHTML = `
                <div class="typing-text">
                    ${data.machineName}
                    is editing

                    <span class="typing-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </div>
            `;

            cell.appendChild(overlay);
        });

        DOR.socket.on("rowAdded", (data) => {
            const table = document.querySelector(
                `table[data-section="${data.section}"]`
            );

            if (!table) return;

            const rowNumber = table.rows.length;

            const row = table.insertRow();

            row.innerHTML = DOR.table.createRowHTML(
                data.section,
                rowNumber
            );

            DOR.editable.bindEditableCells();
        });

        DOR.socket.on("rowDeleted", (data) => {
            const table = document.querySelector(
                `table[data-section="${data.section}"]`
            );

            if (!table) return;

            if (table.rows.length <= 2) return;

            table.deleteRow(
                table.rows.length - 1
            );
        });

        DOR.socket.on("tableCleared", (data) => {
            const table = document.querySelector(
                `table[data-section="${data.section}"]`
            );

            if (!table) return;

            const rows = table.querySelectorAll("tr");

            for (let i = 1; i < rows.length; i++) {
                rows[i].cells[1].innerText = "";
            }
        });

        DOR.socket.on("sectionReloaded", async () => {
            DOR.state.currentReportData =
                await DOR.api.loadReportData();
        
            DOR.table.init(
                DOR.state.currentReportData
            );
        
            DOR.table.applyReportData(
                DOR.state.currentReportData
            );
        
            DOR.rig.applyHeaderEditPermission();
        });

        DOR.socket.on("updateAvailable", () => {
            if (!DOR.state.isHost) return;

            DOR.toast.show(
                "New update available. Click Update Now.",
                "warning"
            );

            const btn =
                document.createElement("button");

            btn.innerText = "Update Now";
            btn.className = "update-now-btn";

            btn.onclick = async () => {
                await fetch("/update-now", {
                    method: "POST"
                });
            };

            document.body.appendChild(btn);
        });

        DOR.socket.on("serverUpdating", () => {
            DOR.toast.show(
                "Server is updating. Please reconnect in a moment.",
                "warning"
            );
        });
    }
};