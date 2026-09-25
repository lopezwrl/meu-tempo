(function () {
  const scriptTag = document.currentScript;
  const start = scriptTag.getAttribute("data-start");

  const btn = document.getElementById("balanceWeekBtn");
  const overlay = document.getElementById("balanceModalOverlay");
  const body = document.getElementById("balanceModalBody");
  const applyBtn = document.getElementById("balanceApplyBtn");
  const cancelBtn = document.getElementById("balanceCancelBtn");
  const closeBtn = document.getElementById("balanceModalClose");

  function render(data) {
    if (!data.suggestions.length) {
      body.innerHTML = '<p class="empty-hint">Sua semana já está equilibrada — nenhuma redistribuição necessária.</p>';
      applyBtn.style.display = "none";
      return;
    }
    let html = '<div class="bar-list">';
    data.suggestions.forEach((s) => {
      html += `<div class="compare-row"><span>${s.name}</span><strong>${s.from_date.slice(8,10)}/${s.from_date.slice(5,7)} para ${s.to_date.slice(8,10)}/${s.to_date.slice(5,7)}</strong></div>`;
      html += `<p class="empty-hint" style="margin:-4px 0 8px;">${s.reason}</p>`;
    });
    html += "</div>";
    body.innerHTML = html;
    applyBtn.style.display = "inline-flex";
  }

  if (btn) {
    btn.addEventListener("click", async () => {
      overlay.classList.add("is-open");
      body.innerHTML = '<p class="empty-hint">Calculando...</p>';
      applyBtn.style.display = "none";
      const res = await fetch("/api/planning/week/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start, apply: false }),
      });
      render(await res.json());
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", async () => {
      await fetch("/api/planning/week/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start, apply: true }),
      });
      window.showToast && window.showToast("Semana equilibrada.");
      window.location.reload();
    });
  }

  function close() { overlay.classList.remove("is-open"); }
  if (cancelBtn) cancelBtn.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
})();
