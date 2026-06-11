DOR.pdf = {

    async exportPDF() {

        const loading =
            document.getElementById(
                "loadingScreen"
            );

        try {

            if (loading) {
                loading.classList.add(
                    "active"
                );
            }

            const machineName =
                DOR.state.machineName ||
                "Unknown-PC";

            const isHost =
                DOR.state.isHost === true;

            const res = await fetch(
                `/exportPDF?machineName=${encodeURIComponent(machineName)}&isHost=${isHost}`
            );

            if (!res.ok) {

                const text =
                    await res.text();

                DOR.toast.show(
                    text || "PDF export failed",
                    "error"
                );

                return;
            }

            const contentType =
                res.headers.get(
                    "Content-Type"
                ) || "";

            const blob =
                await res.blob();

            if (
                !contentType.includes(
                    "application/pdf"
                )
            ) {

                const text =
                    await blob.text();

                DOR.toast.show(
                    text ||
                    "Invalid PDF response",
                    "error"
                );

                return;
            }

            if (blob.size < 500) {

                DOR.toast.show(
                    "PDF file is too small",
                    "error"
                );

                return;
            }

            if (!isHost) {

                const url =
                    window.URL.createObjectURL(
                        blob
                    );

                const a =
                    document.createElement(
                        "a"
                    );

                a.href = url;

                a.download =
                    res.headers.get(
                        "X-PDF-File-Name"
                    ) ||
                    `DOR-${Date.now()}.pdf`;

                document.body.appendChild(a);

                a.click();

                a.remove();

                setTimeout(() => {

                    window.URL.revokeObjectURL(
                        url
                    );

                }, 1000);

                DOR.toast.show(
                    "PDF downloaded",
                    "success"
                );

                return;
            }

            DOR.toast.show(
                "PDF saved",
                "success"
            );

        } catch (err) {

            console.error(err);

            DOR.toast.show(
                "PDF export failed",
                "error"
            );

        } finally {

            if (loading) {

                loading.classList.remove(
                    "active"
                );
            }
        }
    }
};

window.exportPDF =
    DOR.pdf.exportPDF;