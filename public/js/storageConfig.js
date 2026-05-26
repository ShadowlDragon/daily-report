DOR.storageConfig = {
    async init() {
        const config = await DOR.api.getConfig();

        DOR.state.isHost = !!config.isHost;

        const modal = document.getElementById("storageModal");
        const input = document.getElementById("reportFolderInput");
        const rigInput = document.getElementById("rigNameInput");
        const saveBtn = document.getElementById("saveFolderBtn");
        const cancelBtn = document.getElementById("cancelFolderBtn");
        const settingBtn = document.getElementById("folderSettingBtn");

        if (!modal || !input || !rigInput || !saveBtn || !settingBtn) {
            console.error("Storage config elements missing");
            return;
        }

        DOR.state.currentRigName = config.rigName || "";

        DOR.rig.applyRigName(
            DOR.state.currentRigName
        );

        DOR.rig.applyHeaderEditPermission();

        settingBtn.style.display =
            config.isHost ? "flex" : "none";

        if (!config.hasConfig && config.isHost) {
            modal.classList.add("active");
        }

        input.value = config.reportFolder || "";
        rigInput.value = config.rigName || "";

        settingBtn.onclick = () => {
            input.value = config.reportFolder || "";

            rigInput.value =
                DOR.state.currentRigName ||
                config.rigName ||
                "";

            modal.classList.add("active");

            setTimeout(() => {
                if (!input.value) {
                    input.focus();
                } else {
                    rigInput.focus();
                }
            }, 100);
        };

        saveBtn.onclick = async () => {
            const folder = input.value.trim();
            const rigName = rigInput.value.trim();

            if (!folder) {
                alert("Please enter folder path");
                return;
            }

            if (!rigName) {
                alert("Please enter rig name");
                return;
            }

            const saveRes = await DOR.api.saveConfig(
                folder,
                rigName
            );

            if (!saveRes.ok) {
                alert(await saveRes.text());
                return;
            }

            DOR.state.currentRigName = rigName;

            DOR.rig.applyRigName(
                DOR.state.currentRigName
            );

            modal.classList.remove("active");

            alert("Configuration saved");

            location.reload();
        };

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                if (!config.hasConfig) return;

                modal.classList.remove("active");
            };
        }

        modal.onkeydown = (e) => {
            if (e.key === "Enter") {
                saveBtn.click();
            }

            if (e.key === "Escape") {
                if (!config.hasConfig) return;

                modal.classList.remove("active");
            }
        };
    }
};