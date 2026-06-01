DOR.floatingTools = {
    init() {
        const floatingTools = document.getElementById("floatingTools");
        const toolToggleBtn = document.getElementById("toolToggleBtn");

        if (!floatingTools || !toolToggleBtn) return;

        toolToggleBtn.onclick = (e) => {
            e.stopPropagation();
            floatingTools.classList.toggle("collapsed");
        };

        document.addEventListener("click", (e) => {
            if (
                !floatingTools.contains(e.target) &&
                !toolToggleBtn.contains(e.target)
            ) {
                floatingTools.classList.add("collapsed");
            }
        });
    }
};