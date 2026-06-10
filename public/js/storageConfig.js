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
        const autoPdfInput = document.getElementById("autoPdfExportInput");

        if (!modal || !input || !rigInput || !saveBtn || !settingBtn || !autoPdfInput) {
            console.error("Storage config elements missing");
            return;
        }

        function toBoolean(value) {
            return value === true || value === "true";
        }

        DOR.state.currentRigName = config.rigName || "";

        DOR.rig.applyRigName(
            DOR.state.currentRigName
        );

        autoPdfInput.checked =
            toBoolean(config.autoPdfExport);

        DOR.rig.applyHeaderEditPermission();

        settingBtn.style.display =
            config.isHost ? "flex" : "none";

        if (
            config.isHost &&
            !String(config.reportFolder || "").trim()
        ) {
            modal.classList.add("active");
        }

        input.value = config.reportFolder || "";
        rigInput.value = config.rigName || "";

        settingBtn.onclick = async () => {
            const latestConfig =
                await DOR.api.getConfig();

            input.value =
                latestConfig.reportFolder || "";

            rigInput.value =
                latestConfig.rigName || "";

            autoPdfInput.checked =
                toBoolean(latestConfig.autoPdfExport);

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
                DOR.toast.show(
                    "Please enter folder path",
                    "warning"
                );
                return;
            }

            if (!rigName) {
                DOR.toast.show(
                    "Please enter rig name",
                    "warning"
                );
                return;
            }

            const saveRes = await DOR.api.saveConfig(
                folder,
                rigName,
                autoPdfInput.checked
            );

            if (!saveRes.ok) {
                DOR.toast.show(
                    await saveRes.text(),
                    "error"
                );
                return;
            }

            DOR.state.currentRigName = rigName;

            DOR.rig.applyRigName(
                DOR.state.currentRigName
            );

            modal.classList.remove("active");

            DOR.toast.show(
                "Configuration saved",
                "success"
            );

            setTimeout(() => {
                modal.classList.remove("active");
            }, 300);
        };

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                const hasConfig =
                    !!(
                        input.value.trim() ||
                        config.reportFolder
                    );

                if (!hasConfig) return;

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