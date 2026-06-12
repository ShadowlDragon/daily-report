DOR.main = {
    async start() {
        DOR.machineSettings.init();

        DOR.floatingTools.init();

        DOR.socketClient.init();

        DOR.table.initControls();

        await DOR.storageConfig.init();

        const dateCell = document.getElementById("date");

        if (dateCell) {
            dateCell.innerText =
                DOR.dateUtils.getDisplayToday();
        }

        DOR.state.currentReportData =
            await DOR.api.loadReportData();

        DOR.table.init(
            DOR.state.currentReportData
        );

        DOR.table.applyReportData(
            DOR.state.currentReportData
        );

        DOR.rig.applyRigName(
            DOR.state.currentRigName
        );

        DOR.rig.applyHeaderEditPermission();

        DOR.editable.bindEditableCells();
    }
};