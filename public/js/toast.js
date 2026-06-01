DOR.toast = {
    show(message, type = "success") {
        const oldToast = document.querySelector(".dor-toast");

        if (oldToast) {
            oldToast.remove();
        }

        const toast = document.createElement("div");

        toast.className = `dor-toast ${type}`;
        toast.innerText = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("show");
        }, 10);

        setTimeout(() => {
            toast.classList.remove("show");

            setTimeout(() => {
                toast.remove();
            }, 200);
        }, 1800);
    }
};