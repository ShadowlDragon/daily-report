DOR.pdf = {
    async exportPDF() {
        const loading = document.getElementById("loadingScreen");

        try {
            if (loading) {
                loading.classList.add("active");
            }

            const machineName =
                DOR.state.machineName ||
                "Unknown-PC";

            const res = await fetch(
                `/exportPDF?machineName=${encodeURIComponent(machineName)}`
            );

            if (!res.ok) {
                const text = await res.text();

                alert(text);

                return;
            }

            const contentType =
                res.headers.get("Content-Type") || "";

            const blob = await res.blob();

            if (!contentType.includes("application/pdf")) {
                const text = await blob.text();

                alert(text || "Invalid PDF response");

                return;
            }

            if (blob.size < 500) {
                alert("PDF file is too small");
                return;
            }

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");

            a.href = url;
            a.download = `DOR-${Date.now()}.pdf`;

            document.body.appendChild(a);

            a.click();

            a.remove();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

        } catch (err) {
            console.error(err);

            alert("PDF export failed");

        } finally {
            if (loading) {
                loading.classList.remove("active");
            }
        }
    }
};

window.exportPDF = DOR.pdf.exportPDF;