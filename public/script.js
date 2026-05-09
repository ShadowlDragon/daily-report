// =========================
// SECTIONS
// =========================
const sections = [
    "Safety",
    "Drilling",
    "Marine",
    "Mechanic",
    "Electrician",
    "ET"
];

let currentTable = null;

const socket = io();


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


// =========================
// INIT
// =========================
function init() {

    document.getElementById("date")
    .innerText = getToday();

    // remove old section
    document.querySelectorAll(".section-block")
    .forEach(el => el.remove());

    const container =
        document.getElementById("report");

    sections.forEach(name => {

        let title =
            document.createElement("div");

        title.className = "section-title";
        title.innerText = name;

        let table =
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

        for (let i = 1; i <= 5; i++) {

            table.innerHTML += `
                <tr>

                    <td class="no"
                        style="text-align:center">
                        ${i}
                    </td>

                    <td
                        contenteditable="true"
                        data-cell="${name}-${i}">
                    </td>

                </tr>
            `;
        }

        let block =
            document.createElement("div");

        block.className = "section-block";

        block.appendChild(title);
        block.appendChild(table);

        container.appendChild(block);
    });

    bindTables();

    bindEditableCells();
}


// =========================
// LOAD REPORT
// =========================
async function loadReport() {

    const date =
        document.getElementById("date")
        .innerText;

    const res =
        await fetch(`/load/${date}`);

    const data =
        await res.json();

    Object.keys(data)
    .forEach(cellId => {

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
// BIND TABLES
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


// =========================
// TOOLBAR
// =========================
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
// AUTO NUMBER
// =========================
function renumber(table) {

    let rows =
        table.querySelectorAll("tr");

    for (let i = 1; i < rows.length; i++) {

        rows[i]
        .querySelector(".no")
        .innerText = i;
    }
}


// =========================
// ADD ROW
// =========================
function addRow() {

    if (!currentTable) {

        alert("Choose table");

        return;
    }

    const section =
        currentTable.dataset.section;

    const rowCount =
        currentTable.rows.length;

    const row =
        currentTable.insertRow();

    row.innerHTML = `
        <td class="no"
            style="text-align:center">
            ${rowCount}
        </td>

        <td
            contenteditable="true"
            data-cell="${section}-${rowCount}">
        </td>
    `;

    bindEditableCells();

    socket.emit("addRow", {
        section
    });
}


// =========================
// DELETE ROW
// =========================
function deleteRow() {

    if (!currentTable) {

        alert("Choose table");

        return;
    }

    if (currentTable.rows.length <= 2) {

        alert("No more rows");

        return;
    }

    const section =
        currentTable.dataset.section;

    currentTable.deleteRow(
        currentTable.rows.length - 1
    );

    socket.emit("deleteRow", {
        section
    });
}


// =========================
// CLEAR TABLE
// =========================
function clearTable() {

    if (!currentTable) {

        alert("Choose table");

        return;
    }

    const section =
        currentTable.dataset.section;

    const rows =
        currentTable.querySelectorAll("tr");

    for (let i = 1; i < rows.length; i++) {

        rows[i]
        .cells[1]
        .innerText = "";
    }

    socket.emit("clearTable", {
        section
    });
}


// =========================
// EXPORT PDF
// =========================
function exportPDF() {

    const content =
        document.getElementById("report")
        .cloneNode(true);

    const iframe =
        document.createElement("iframe");

    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";

    document.body.appendChild(iframe);

    const doc =
        iframe.contentWindow.document;

    doc.open();

    doc.write(`
        <html>

        <head>

            <style>

                body {
                    margin: 0;
                    font-family: Arial;
                    background: white;
                }

                .page {
                    width: 794px;
                    padding: 15px;
                    box-sizing: border-box;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                td, th {
                    border: 1px solid black;
                    padding: 5px;
                }

                .section-title {
                    background: #cfe2f3;
                    font-weight: bold;
                    padding: 4px;
                }

            </style>

        </head>

        <body>
            ${content.outerHTML}
        </body>

        </html>
    `);

    doc.close();

    setTimeout(() => {

        html2pdf()
        .set({

            margin: 0,

            filename: "report.pdf",

            html2canvas: {
                scale: 2
            },

            jsPDF: {
                unit: "mm",
                format: "a4"
            }

        })
        .from(doc.body)
        .save()
        .then(() => {

            document.body
            .removeChild(iframe);
        });

    }, 300);
}


// =========================
// SAVE CELL
// =========================
async function saveCell(
    cellId,
    value
) {

    const date =
        document.getElementById("date")
        .innerText;

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
// BIND EDITABLE
// =========================
function bindEditableCells() {

    document
    .querySelectorAll("[contenteditable]")
    .forEach(cell => {

        if (cell.dataset.bound)
            return;

        cell.dataset.bound = "1";

        // FOCUS
        cell.addEventListener(
            "focus",
            () => {

                const cellId =
                    cell.dataset.cell;

                if (!cellId) return;

                // LOCK
                socket.emit(
                    "lockCell",
                    cellId
                );

                // EDITING INDICATOR
                socket.emit(
                    "typing",
                    cellId
                );
            }
        );

        // SAVE
        cell.addEventListener(
            "blur",
            async () => {

                const cellId =
                    cell.dataset.cell;

                if (!cellId) return;

                const value =
                    cell.innerText;

                await saveCell(
                    cellId,
                    value
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
// LOCKED
// =========================
socket.on("cellLocked", (cellId) => {

    const cell =
        document.querySelector(
            `[data-cell="${cellId}"]`
        );

    if (!cell) return;

    if (document.activeElement === cell)
        return;

    cell.contentEditable = false;

    cell.style.background =
        "#ffd6d6";
});


// =========================
// UNLOCKED
// =========================
socket.on("cellUnlocked", (cellId) => {

    const cell =
        document.querySelector(
            `[data-cell="${cellId}"]`
        );

    if (!cell) return;

    cell.contentEditable = true;

    cell.style.background = "";

    const overlay =
        cell.querySelector(
            ".typing-overlay"
        );

    if (overlay)
        overlay.remove();
});


// =========================
// CELL UPDATED
// =========================
socket.on("cellUpdated", (data) => {

    const cell =
        document.querySelector(
            `[data-cell="${data.cellId}"]`
        );

    if (!cell) return;

    if (document.activeElement === cell)
        return;

    cell.innerText =
        data.value;
});


// =========================
// ROW ADDED
// =========================
socket.on("rowAdded", (data) => {

    const table =
        document.querySelector(
            `table[data-section="${data.section}"]`
        );

    if (!table) return;

    const rowCount =
        table.rows.length;

    const row =
        table.insertRow();

    row.innerHTML = `
        <td class="no"
            style="text-align:center">
            ${rowCount}
        </td>

        <td
            contenteditable="true"
            data-cell="${data.section}-${rowCount}">
        </td>
    `;

    bindEditableCells();
});


// =========================
// ROW DELETED
// =========================
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


// =========================
// TABLE CLEARED
// =========================
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
// TYPING
// =========================
socket.on("typing", (data) => {

    const cell =
        document.querySelector(
            `[data-cell="${data.cellId}"]`
        );

    if (!cell) return;

    if (document.activeElement === cell)
        return;

    // remove old overlay
    const old =
        cell.querySelector(
            ".typing-overlay"
        );

    if (old)
        old.remove();

    // create overlay
    const overlay =
        document.createElement("div");

    overlay.className =
        "typing-overlay";

    overlay.innerHTML = `
        <div class="typing-text">

            ${data.ip} is editing

            <span class="typing-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </span>

        </div>
    `;

    cell.appendChild(overlay);
});


// =========================
// START
// =========================
async function start() {

    init();

    await loadReport();
}

start();