DOR.floatingTools = {
    init() {
        const floatingTools = document.getElementById("floatingTools");
        const toolToggleBtn = document.getElementById("toolToggleBtn");

        if (!floatingTools || !toolToggleBtn) return;

        toolToggleBtn.onclick = (e) => {
            e.stopPropagation();
        
            const controls = document.querySelector(".controls");
        
            if (controls) {
                controls.classList.remove("active");
            }
        
            DOR.state.currentTable = null;
        
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