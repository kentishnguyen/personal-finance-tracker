async function uploadReceipt() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    const statusEl = document.getElementById("uploadStatus");
    //const resultEl = document.getElementById("result");

    if (!file) {
        alert("Please select a file first.");
        return;
    }

    statusEl.textContent = "Uploading and processing...";
    //resultEl.textContent = "";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/receipts/process", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            statusEl.textContent = "Error: " + (data.detail || "Unknown error");
            return;
        }

        statusEl.textContent = "✅ Receipt processed successfully!";
        //resultEl.textContent = JSON.stringify(data, null, 2);
	await loadHistory();
        loadSummary();
    } catch (err) {
        console.error(err);
        statusEl.textContent = "Upload failed. Check console for details.";
    }
}

async function loadHistory() {
    try {
        const res = await fetch("/api/receipts");
        const receipts = await res.json();

        const tbody = document.getElementById("historyBody");
        tbody.innerHTML = "";

        // ✅ only show successfully parsed receipts
        const successful = receipts.filter(r => r.status === "parsed");

        if (successful.length === 0) {
            tbody.innerHTML =
                "<tr><td colspan='5'>No receipts yet.</td></tr>";
            return;
        }

        for (const r of successful) {
            const tr = document.createElement("tr");

            const totalText =
                r.total !== null && r.total !== undefined
                    ? "$" + Number(r.total).toFixed(2)
                    : "_";

            tr.innerHTML = `
                <td>${r.id}</td>
                <td>${r.store_name || "_"}</td>
                <td>${r.purchase_date || "_"}</td>
                <td>${totalText}</td>
                <td class="status-${r.status}">${r.status}</td>
            `;

            tbody.appendChild(tr);
        }
    } catch (err) {
        console.error("Failed to load history:", err);

        const tbody = document.getElementById("historyBody");
        tbody.innerHTML =
            "<tr><td colspan='5'>Failed to load receipts.</td></tr>";
    }
}

async function loadSummary() {
    const period = document.getElementById("summaryPeriod").value;
    try {
        const res = await fetch(`/api/receipts/summary?period=${period}`);
        const data = await res.json();
        const tbody = document.getElementById("summaryBody");
        tbody.innerHTML = "";

        if (!data.groups || data.groups.length === 0) {
            tbody.innerHTML = "<tr><td colspan='3'>No data yet.</td></tr>";
            return;
        }

        for (const g of data.groups) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${g.period_start}</td>
                <td>${g.receipt_count}</td>
                <td>$${parseFloat(g.total_spend).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        }
    } catch (err) {
        console.error("Failed to load summary:", err);
    }
}

// Load data on page start
loadHistory();
loadSummary();
window.addEventListener("DOMContentLoaded", () => {
    loadHistory();
});
