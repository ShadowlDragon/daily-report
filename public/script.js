// =========================
// SCRIPT.JS
// =========================


// =========================
// MACHINE NAME
// =========================

let machineName =
    localStorage.getItem(
        "machineName"
    );


// SETTINGS ELEMENTS
const settingsModal =
    document.getElementById(
        "settingsModal"
    );

const machineNameInput =
    document.getElementById(
        "machineNameInput"
    );

const saveMachineBtn =
    document.getElementById(
        "saveMachineBtn"
    );

const cancelMachineBtn =
    document.getElementById(
        "cancelMachineBtn"
    );


// FIRST TIME
if (!machineName) {

    settingsModal
        .classList.add(
            "active"
        );
}


// SOCKET
const socket = io({

    auth: {

        machineName:
            machineName || "Unknown-PC"
    }
});


// =========================
// FLOATING TOOLS
// =========================

const floatingTools =
    document.getElementById(
        "floatingTools"
    );

const toolToggleBtn =
    document.getElementById(
        "toolToggleBtn"
    );

if (toolToggleBtn && floatingTools) {

    toolToggleBtn.onclick = () => {

        floatingTools.classList.toggle(
            "collapsed"
        );
    };
}


// =========================
// SETTINGS BUTTON
// =========================

const settingsBtn =
    document.getElementById(
        "settingsBtn"
    );


// OPEN MODAL
settingsBtn.addEventListener(
    "click",
    () => {

        machineNameInput.value =
            machineName || "";

        settingsModal
            .classList.add(
                "active"
            );

        setTimeout(() => {

            machineNameInput.focus();

        }, 100);
    }
);


// SAVE MACHINE NAME
saveMachineBtn.addEventListener(
    "click",
    () => {

        const newName =
            machineNameInput.value
                .trim();

        if (!newName)
            return;

        localStorage.setItem(
            "machineName",
            newName
        );

        machineName = newName;

        location.reload();
    }
);


// CANCEL MACHINE NAME
cancelMachineBtn.addEventListener(
    "click",
    () => {

        // lần đầu chưa có tên thì không cho đóng
        if (!machineName)
            return;

        settingsModal
            .classList.remove(
                "active"
            );
    }
);


// ENTER = SAVE MACHINE NAME
machineNameInput.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Enter") {

            saveMachineBtn.click();
        }
    }
);


// =========================
// CONFIG
// =========================

const sections = [
    "Safety",
    "Drilling",
    "Marine",
    "Mechanic",
    "Electrician",
    "ET"
];

const DEFAULT_ROW_COUNT = 5;

let currentVersion = null;

let currentTable = null;

let currentReportData = {};


// =========================
// DATE
// =========================
function getToday() {

    const today = new Date();

    return (
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0")
    );
}

function getDisplayToday() {

    const today = new Date();

    return (
        String(today.getDate()).padStart(2, "0") + "/" +
        String(today.getMonth() + 1).padStart(2, "0") + "/" +
        today.getFullYear()
    );
}


// =========================
// CREATE SECTION ROW
// =========================
function createRowHTML(section, rowNumber) {

    return `
        <td class="no"
            style="text-align:center">

            ${rowNumber}

        </td>

        <td
            contenteditable="true"
            data-cell="${section}-${rowNumber}">
        </td>
    `;
}


// =========================
// INIT
// =========================
function init(reportData = {}) {

    document.getElementById("date")
        .innerText = getDisplayToday();

    document.querySelectorAll(".section-block")
        .forEach(el => el.remove());

    const container =
        document.getElementById("report");

    const savedRows =
        reportData.__rows__ || {};

    sections.forEach(name => {

        const title =
            document.createElement("div");

        title.className =
            "section-title";

        title.innerText = name;

        const table =
            document.createElement("table");

        table.dataset.section = name;

        table.innerHTML = `
            <tr>

                <th style="width:50px">
                    No.
                </th>

                <th>
                    Activity / Work Done
                </th>

            </tr>
        `;

        const rowCount =
            Math.max(
                DEFAULT_ROW_COUNT,
                Number(savedRows[name]) || DEFAULT_ROW_COUNT
            );

        for (let i = 1; i <= rowCount; i++) {

            const row =
                table.insertRow();

            row.innerHTML =
                createRowHTML(name, i);
        }

        const block =
            document.createElement("div");

        block.className =
            "section-block";

        block.appendChild(title);
        block.appendChild(table);

        container.appendChild(block);
    });

    bindTables();

    bindEditableCells();
}


// =========================
// LOAD REPORT DATA
// =========================
async function loadReportData() {

    const date =
        getToday();

    const res =
        await fetch(`/load/${date}`);

    if (!res.ok) {

        console.error(
            await res.text()
        );

        return {};
    }

    return await res.json();
}


// =========================
// APPLY REPORT DATA
// =========================
function applyReportData(data) {

    Object.keys(data)
        .forEach(cellId => {

            if (cellId === "__rows__")
                return;

            const cell =
                document.querySelector(
                    `[data-cell="${cellId}"]`
                );

            if (!cell) return;

            cell.innerText =
                data[cellId];
        });
}


// =========================
// LOAD REPORT
// =========================
async function loadReport() {

    currentReportData =
        await loadReportData();

    applyReportData(
        currentReportData
    );
}


// =========================
// SAVE ROW COUNT
// =========================
async function saveSectionRows(section, rowCount) {

    const date =
        getToday();

    await fetch("/saveRows", {

        method: "POST",

        headers: {
            "Content-Type":
                "application/json"
        },

        body: JSON.stringify({

            date,
            section,
            rowCount
        })
    });
}


// =========================
// EXPORT PDF
// =========================
async function exportPDF() {

    const loading =
        document.getElementById(
            "loadingScreen"
        );

    try {

        loading.classList.add(
            "active"
        );

        const res =
            await fetch(
                `/exportPDF?machineName=${encodeURIComponent(machineName || "Unknown-PC")}`
            );

        if (!res.ok) {

            const text =
                await res.text();

            alert(text);

            return;
        }

        const contentType =
            res.headers.get("Content-Type") || "";

        const blob =
            await res.blob();

        if (!contentType.includes("application/pdf")) {

            const text =
                await blob.text();

            alert(text || "Invalid PDF response");

            return;
        }

        if (blob.size < 500) {

            alert("PDF file is too small");

            return;
        }

        const url =
            window.URL
                .createObjectURL(blob);

        const a =
            document.createElement("a");

        a.href = url;

        a.download =
            `DOR-${Date.now()}.pdf`;

        document.body.appendChild(a);

        a.click();

        a.remove();

        setTimeout(() => {

            window.URL
                .revokeObjectURL(url);

        }, 1000);

    } catch (err) {

        console.error(err);

        alert(
            "PDF export failed"
        );

    } finally {

        loading.classList.remove(
            "active"
        );
    }
}


// =========================
// TOOLBAR
// =========================
function bindTables() {

    document.querySelectorAll("table")
        .forEach(table => {

            table.onclick = (e) => {

                e.stopPropagation();

                currentTable = table;

                document
                    .querySelector(".controls")
                    .classList.add("active");
            };
        });
}


document.addEventListener("click", (e) => {

    if (
        !e.target.closest("table") &&
        !e.target.closest(".controls")
    ) {

        document
            .querySelector(".controls")
            .classList.remove("active");
    }
});


document.querySelector(".controls")
    .addEventListener("click", (e) => {

        e.stopPropagation();
    });


// =========================
// ADD ROW
// =========================
async function addRow() {

    if (!currentTable) return;

    const section =
        currentTable.dataset.section;

    const rowNumber =
        currentTable.rows.length;

    const row =
        currentTable.insertRow();

    row.innerHTML =
        createRowHTML(
            section,
            rowNumber
        );

    bindEditableCells();

    await saveSectionRows(
        section,
        currentTable.rows.length - 1
    );

    socket.emit("addRow", {
        section
    });
}


// =========================
// DELETE ROW
// =========================
async function deleteRow() {

    if (!currentTable) return;

    if (currentTable.rows.length <= 2)
        return;

    const section =
        currentTable.dataset.section;

    const deletedRowNumber =
        currentTable.rows.length - 1;

    const deletedCellId =
        `${section}-${deletedRowNumber}`;

    currentTable.deleteRow(
        currentTable.rows.length - 1
    );

    await saveSectionRows(
        section,
        currentTable.rows.length - 1
    );

    // clear content of deleted row in saved JSON
    await saveCell(
        deletedCellId,
        ""
    );

    socket.emit("deleteRow", {
        section
    });
}


// =========================
// CLEAR TABLE
// =========================
async function clearTable() {

    if (!currentTable) return;

    const section =
        currentTable.dataset.section;

    const rows =
        currentTable.querySelectorAll("tr");

    for (let i = 1; i < rows.length; i++) {

        const cell =
            rows[i].cells[1];

        cell.innerText = "";

        const cellId =
            `${section}-${i}`;

        await saveCell(
            cellId,
            ""
        );
    }

    socket.emit("clearTable", {
        section
    });
}


// =========================
// SAVE CELL
// =========================
async function saveCell(cellId, value) {

    const date =
        getToday();

    await fetch("/saveCell", {

        method: "POST",

        headers: {
            "Content-Type":
                "application/json"
        },

        body: JSON.stringify({

            date,
            cellId,
            value
        })
    });
}


// =========================
// EDITABLE CELLS
// =========================
function bindEditableCells() {

    document
        .querySelectorAll("[contenteditable]")
        .forEach(cell => {

            if (cell.dataset.bound)
                return;

            cell.dataset.bound = "1";

            cell.addEventListener(
                "focus",
                () => {

                    const cellId =
                        cell.dataset.cell;

                    if (!cellId) return;

                    socket.emit(
                        "lockCell",
                        cellId
                    );

                    socket.emit(
                        "typing",
                        cellId
                    );
                }
            );

            cell.addEventListener(
                "blur",
                async () => {

                    const cellId =
                        cell.dataset.cell;

                    if (!cellId) return;

                    await saveCell(
                        cellId,
                        cell.innerText
                    );

                    socket.emit(
                        "unlockCell",
                        cellId
                    );
                }
            );
        });
}


// =========================
// SOCKET EVENTS
// =========================

// UPDATE CELL
socket.on("cellUpdated", (data) => {

    const cell =
        document.querySelector(
            `[data-cell="${data.cellId}"]`
        );

    if (!cell) return;

    if (document.activeElement === cell)
        return;

    const overlay =
        cell.querySelector(
            ".typing-overlay"
        );

    cell.innerText =
        data.value;

    if (overlay) {

        cell.appendChild(overlay);
    }
});


// LOCK
socket.on("cellLocked", (cellId) => {

    const cell =
        document.querySelector(
            `[data-cell="${cellId}"]`
        );

    if (!cell) return;

    if (document.activeElement === cell)
        return;

    cell.setAttribute(
        "contenteditable",
        "false"
    );

    cell.style.background =
        "#ffe4e4";
});


// UNLOCK
socket.on("cellUnlocked", (cellId) => {

    const cell =
        document.querySelector(
            `[data-cell="${cellId}"]`
        );

    if (!cell) return;

    cell.setAttribute(
        "contenteditable",
        "true"
    );

    cell.style.background =
        "white";

    const overlay =
        cell.querySelector(
            ".typing-overlay"
        );

    if (overlay)
        overlay.remove();
});


// TYPING
socket.on("typing", (data) => {

    const cell =
        document.querySelector(
            `[data-cell="${data.cellId}"]`
        );

    if (!cell) return;

    if (document.activeElement === cell)
        return;

    const old =
        cell.querySelector(
            ".typing-overlay"
        );

    if (old)
        old.remove();

    const overlay =
        document.createElement("div");

    overlay.className =
        "typing-overlay";

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


// ADD ROW FROM OTHER USER
socket.on("rowAdded", (data) => {

    const table =
        document.querySelector(
            `table[data-section="${data.section}"]`
        );

    if (!table) return;

    const rowNumber =
        table.rows.length;

    const row =
        table.insertRow();

    row.innerHTML =
        createRowHTML(
            data.section,
            rowNumber
        );

    bindEditableCells();
});


// DELETE ROW FROM OTHER USER
socket.on("rowDeleted", (data) => {

    const table =
        document.querySelector(
            `table[data-section="${data.section}"]`
        );

    if (!table) return;

    if (table.rows.length <= 2)
        return;

    table.deleteRow(
        table.rows.length - 1
    );
});


// CLEAR TABLE FROM OTHER USER
socket.on("tableCleared", (data) => {

    const table =
        document.querySelector(
            `table[data-section="${data.section}"]`
        );

    if (!table) return;

    const rows =
        table.querySelectorAll("tr");

    for (let i = 1; i < rows.length; i++) {

        rows[i]
            .cells[1]
            .innerText = "";
    }
});


// =========================
// STORAGE CONFIG
// =========================
async function initStorageConfig() {

    const res =
        await fetch("/config");

    const config =
        await res.json();

    const modal =
        document.getElementById("storageModal");

    const input =
        document.getElementById("reportFolderInput");

    const saveBtn =
        document.getElementById("saveFolderBtn");

    const cancelBtn =
        document.getElementById("cancelFolderBtn");

    const settingBtn =
        document.getElementById("folderSettingBtn");

    if (!modal || !input || !saveBtn || !settingBtn) {

        console.error("Storage config elements missing");
        return;
    }

    // chỉ máy host mới thấy nút Storage
    if (config.isHost) {

        settingBtn.style.display =
            "flex";

    } else {

        settingBtn.style.display =
            "none";
    }

    // lần đầu chưa có config thì bắt host chọn folder
    if (!config.hasConfig && config.isHost) {

        modal.classList.add(
            "active"
        );
    }

    input.value =
        config.reportFolder || "";


    // OPEN STORAGE MODAL
    settingBtn.onclick = () => {

        input.value =
            config.reportFolder || "";

        modal.classList.add(
            "active"
        );

        setTimeout(() => {

            input.focus();

        }, 100);
    };


    // SAVE STORAGE FOLDER
    saveBtn.onclick = async () => {

        const folder =
            input.value.trim();

        if (!folder) {

            alert(
                "Please enter folder path"
            );

            return;
        }

        const saveRes =
            await fetch("/config", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    reportFolder:
                        folder
                })
            });

        if (!saveRes.ok) {

            alert(
                await saveRes.text()
            );

            return;
        }

        modal.classList.remove(
            "active"
        );

        alert(
            "Storage folder saved"
        );

        location.reload();
    };


    // CANCEL
    if (cancelBtn) {

        cancelBtn.onclick = () => {

            // nếu lần đầu chưa setup thì không cho đóng
            if (!config.hasConfig)
                return;

            modal.classList.remove(
                "active"
            );
        };
    }


    // ENTER / ESC
    input.onkeydown = (e) => {

        if (e.key === "Enter") {

            saveBtn.click();
        }

        if (e.key === "Escape") {

            if (!config.hasConfig)
                return;

            modal.classList.remove(
                "active"
            );
        }
    };
}


// =========================
// AUTO HARD REFRESH
// =========================

async function checkVersion() {

    try {

        const res =
            await fetch(
                "/version?t=" +
                Date.now()
            );

        const data =
            await res.json();

        // first load
        if (!currentVersion) {

            currentVersion =
                data.version;

            return;
        }

        // server restarted
        if (
            currentVersion !==
            data.version
        ) {

            console.log(
                "New version detected"
            );

            location.reload(true);
        }

    } catch (err) {

        console.error(err);
    }
}


setInterval(
    checkVersion,
    5000
);

checkVersion();


// =========================
// START
// =========================
async function start() {

    await initStorageConfig();

    document.getElementById("date")
        .innerText = getDisplayToday();

    currentReportData =
        await loadReportData();

    init(currentReportData);

    applyReportData(currentReportData);

    bindEditableCells();
}


start();
