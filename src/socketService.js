function setupSocket(io) {
    const lockedCells = {};
    const cellOwners = {};

    io.on("connection", (socket) => {
        const machineName =
            socket.handshake.auth?.machineName ||
            "Unknown-PC";

        let ip = socket.handshake.address;

        ip = ip.replace("::ffff:", "");

        socket.machineInfo = {
            ip,
            machineName
        };

        console.log(
            `${machineName} ${ip} connected`
        );

        socket.on("lockCell", (cellId) => {
            if (lockedCells[cellId]) {
                socket.emit(
                    "cellLocked",
                    cellId
                );

                return;
            }

            lockedCells[cellId] = true;

            cellOwners[cellId] = socket.id;

            socket.broadcast.emit(
                "cellLocked",
                cellId
            );
        });

        socket.on("unlockCell", (cellId) => {
            delete lockedCells[cellId];
            delete cellOwners[cellId];

            socket.broadcast.emit(
                "cellUnlocked",
                cellId
            );
        });

        socket.on("typing", (cellId) => {
            socket.broadcast.emit(
                "typing",
                {
                    cellId,
                    ip: socket.machineInfo.ip,
                    machineName: socket.machineInfo.machineName
                }
            );
        });

        socket.on("addRow", (data) => {
            socket.broadcast.emit(
                "rowAdded",
                data
            );
        });

        socket.on("deleteRow", (data) => {
            socket.broadcast.emit(
                "rowDeleted",
                data
            );
        });

        socket.on("clearTable", (data) => {
            socket.broadcast.emit(
                "tableCleared",
                data
            );
        });

        socket.on("disconnect", () => {
            console.log(
                `${machineName} ${ip} disconnected`
            );

            for (const cellId in cellOwners) {
                if (cellOwners[cellId] === socket.id) {
                    delete lockedCells[cellId];
                    delete cellOwners[cellId];

                    socket.broadcast.emit(
                        "cellUnlocked",
                        cellId
                    );
                }
            }
        });

        socket.on("sectionReload", (data) => {
            socket.broadcast.emit(
                "sectionReloaded",
                data
            );
        });
    });
}

module.exports = setupSocket;