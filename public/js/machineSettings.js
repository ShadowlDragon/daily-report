DOR.machineSettings = {
    init() {
        const settingsModal = document.getElementById("settingsModal");
        const machineNameInput = document.getElementById("machineNameInput");
        const saveMachineBtn = document.getElementById("saveMachineBtn");
        const cancelMachineBtn = document.getElementById("cancelMachineBtn");
        const settingsBtn = document.getElementById("settingsBtn");

        if (!settingsModal) return;

        if (!DOR.state.machineName) {
            settingsModal.classList.add("active");
        }

        if (settingsBtn) {
            settingsBtn.addEventListener("click", () => {
                machineNameInput.value = DOR.state.machineName || "";

                settingsModal.classList.add("active");

                setTimeout(() => {
                    machineNameInput.focus();
                }, 100);
            });
        }

        if (saveMachineBtn) {
            saveMachineBtn.addEventListener("click", () => {
                const newName = machineNameInput.value.trim();

                if (!newName) return;

                localStorage.setItem("machineName", newName);

                DOR.state.machineName = newName;

                location.reload();
            });
        }

        if (cancelMachineBtn) {
            cancelMachineBtn.addEventListener("click", () => {
                if (!DOR.state.machineName) return;

                settingsModal.classList.remove("active");
            });
        }

        if (machineNameInput) {
            machineNameInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    saveMachineBtn.click();
                }
            });
        }
    }
};