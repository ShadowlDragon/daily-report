window.DOR = {
    socket: null,

    state: {
        machineName: localStorage.getItem("machineName"),
        isHost: false,
        currentVersion: null,
        currentTable: null,
        currentReportData: {},
        currentRigName: ""
    },

    config: {
        sections: [
            "Safety",
            "Drilling",
            "Marine",
            "Mechanic",
            "Electrician",
            "ET",
            "MC",
            "Medic"
        ],
        defaultRowCount: 5
    }
};