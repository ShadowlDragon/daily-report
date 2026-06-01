DOR.dateUtils = {
    getToday() {
        const today = new Date();

        return (
            today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0")
        );
    },

    getDisplayToday() {
        const today = new Date();

        return (
            String(today.getDate()).padStart(2, "0") + "/" +
            String(today.getMonth() + 1).padStart(2, "0") + "/" +
            today.getFullYear()
        );
    }
};