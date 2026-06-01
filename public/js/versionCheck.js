DOR.versionCheck = {
    async checkVersion() {
        try {
            const res = await fetch(
                "/version?t=" + Date.now()
            );

            const data = await res.json();

            if (!DOR.state.currentVersion) {
                DOR.state.currentVersion = data.version;
                return;
            }

            if (
                DOR.state.currentVersion !==
                data.version
            ) {
                console.log("New version detected");
                location.reload(true);
            }

        } catch (err) {
            console.error(err);
        }
    },

    init() {
        setInterval(
            DOR.versionCheck.checkVersion,
            5000
        );

        DOR.versionCheck.checkVersion();
    }
};