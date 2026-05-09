// =========================
// SCRIPT.JS
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

    document.querySelectorAll(".section-block")
    .forEach(el => el.remove());

    const container =
        document.getElementById("report");

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
            await fetch("/exportPDF");

        if (!res.ok) {

            const text =
                await res.text();

            alert(text);

            return;
        }

        const blob =
            await res.blob();

        if (blob.size < 1000) {

            alert(
                "Invalid PDF generated"
            );

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
function addRow() {

    if (!currentTable) return;

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

    if (!currentTable) return;

    if (currentTable.rows.length <= 2)
        return;

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

    if (!currentTable) return;

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


// ADD ROW
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


// DELETE ROW
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


// CLEAR TABLE
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
// START
// =========================
async function start() {

    init();

    await loadReport();

    bindEditableCells();
}

start();