DOR.toast = {
    show(message, type = "success") {
        const oldToast = document.querySelector(".dor-toast");

        if (oldToast) {
            oldToast.classList.remove("show");
            oldToast.classList.add("hide");

            setTimeout(() => {
                oldToast.remove();
            }, 320);
        }

        const toast = document.createElement("div");

        toast.className = `dor-toast ${type}`;
        toast.innerText = message;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add("show");
            });
        });

        setTimeout(() => {
            toast.classList.remove("show");
            toast.classList.add("hide");

            setTimeout(() => {
                toast.remove();
            }, 320);
        }, 1800);
    }
};