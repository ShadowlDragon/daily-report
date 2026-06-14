DOR.updateReload = {
    isWaiting: false,

    async waitForServerAndReload() {

        if (DOR.updateReload.isWaiting) {
            return;
        }

        DOR.updateReload.isWaiting = true;

        setTimeout(async () => {

            while (true) {

                try {

                    const res = await fetch(
                        `/health?t=${Date.now()}`,
                        {
                            cache: "no-store"
                        }
                    );

                    if (res.ok) {

                        window.location.replace(
                            `${window.location.pathname}?v=${Date.now()}`
                        );

                        return;
                    }

                } catch (err) {
                    // Server still restarting
                }

                await new Promise(resolve =>
                    setTimeout(resolve, 3000)
                );
            }

        }, 5000);
    }
};