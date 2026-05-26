DOR.rig = {
    applyRigName(rigName) {
        if (!rigName) return;

        DOR.state.currentRigName = rigName;

        document.title = `${rigName} Daily Operation Report`;

        document
            .querySelectorAll("[data-rig-name]")
            .forEach(el => {
                el.innerText = rigName;
            });

        document
            .querySelectorAll("[data-rig-title]")
            .forEach(el => {
                el.innerText = `DAILY OPERATION REPORT ${rigName}`;
            });

        const titleCell = document.querySelector(".title-cell");

        if (titleCell) {
            titleCell.innerText = `DAILY OPERATION REPORT ${rigName}`;
        }

        const rigNameCell = document.querySelector(`[data-cell="RigName"]`);

        if (rigNameCell) {
            rigNameCell.innerText = rigName;
        }
    },

    applyHeaderEditPermission() {
        document
            .querySelectorAll("[data-header]")
            .forEach(cell => {
                cell.setAttribute(
                    "contenteditable",
                    DOR.state.isHost ? "true" : "false"
                );

                cell.classList.toggle(
                    "host-editable",
                    DOR.state.isHost
                );
            });
    }
};