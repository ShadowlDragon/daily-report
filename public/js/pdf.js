DOR.pdf = {

    async exportPDF(selectedSections = []) {

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

            const sections =
                selectedSections.length
                    ? selectedSections.join(",")
                    : "All";

            const res = await fetch(
                `/exportPDF?machineName=${encodeURIComponent(machineName)}&isHost=${isHost}&sections=${encodeURIComponent(sections)}`
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

DOR.pdf.getSectionCheckboxes = function () {
    return Array.from(
        document.querySelectorAll(
            ".pdf-section-checkbox"
        )
    );
};

DOR.pdf.setAllSectionsChecked = function (checked) {
    const allCheckbox =
        document.getElementById("pdfAllSections");

    const sectionCheckboxes =
        DOR.pdf.getSectionCheckboxes();

    sectionCheckboxes.forEach(item => {
        item.checked = checked;
    });

    if (allCheckbox) {
        allCheckbox.checked = checked;
        allCheckbox.indeterminate = false;
    }
};

DOR.pdf.updateAllCheckboxState = function () {
    const allCheckbox =
        document.getElementById("pdfAllSections");

    if (!allCheckbox) return;

    const sectionCheckboxes =
        DOR.pdf.getSectionCheckboxes();

    const checkedCount =
        sectionCheckboxes.filter(
            item => item.checked
        ).length;

    allCheckbox.checked =
        checkedCount === sectionCheckboxes.length;

    allCheckbox.indeterminate =
        checkedCount > 0 &&
        checkedCount < sectionCheckboxes.length;
};

DOR.pdf.bindExportModal = function () {
    const allCheckbox =
        document.getElementById("pdfAllSections");

    const sectionCheckboxes =
        DOR.pdf.getSectionCheckboxes();

    if (allCheckbox) {
        allCheckbox.onchange = () => {
            DOR.pdf.setAllSectionsChecked(
                allCheckbox.checked
            );
        };
    }

    sectionCheckboxes.forEach(item => {
        item.onchange = () => {
            DOR.pdf.updateAllCheckboxState();
        };
    });

    DOR.pdf.updateAllCheckboxState();
};

window.openPdfExportModal = function () {
    const modal =
        document.getElementById("pdfExportModal");

    DOR.pdf.setAllSectionsChecked(true);
    DOR.pdf.bindExportModal();

    modal.classList.add("active");
};

window.closePdfExportModal = function () {
    document
        .getElementById("pdfExportModal")
        .classList.remove("active");
};

window.confirmPdfExport = async function () {
    const selectedSections =
        DOR.pdf
            .getSectionCheckboxes()
            .filter(item => item.checked)
            .map(item => item.value);

    if (!selectedSections.length) {
        DOR.toast.show(
            "Select at least one section",
            "warning"
        );

        return;
    }

    closePdfExportModal();

    await DOR.pdf.exportPDF(
        selectedSections
    );
};

window.exportPDF =
    DOR.pdf.exportPDF;