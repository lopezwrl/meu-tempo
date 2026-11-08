(function () {
  const scriptTag = document.currentScript;
  const currentDate = scriptTag.getAttribute("data-date");

  // ---------- Drag and drop ----------
  let draggingTaskId = null;

  document.querySelectorAll("[data-drag-task]").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      draggingTaskId = el.getAttribute("data-drag-task");
      e.dataTransfer.effectAllowed = "move";
    });
  });

  document.querySelectorAll("[data-drop-target]").forEach((slot) => {
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.classList.add("is-drop-hover");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drop-hover"));
    slot.addEventListener("drop", async (e) => {
      e.preventDefault();
      slot.classList.remove("is-drop-hover");
      if (!draggingTaskId) return;
      const time = slot.getAttribute("data-slot-time");
      await fetch(`/api/tasks/${draggingTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: currentDate, time }),
      });
      window.showToast && window.showToast("Tarefa reagendada.");
      window.location.reload();
    });

    // Clique num horário livre cria tarefa já com data/hora preenchidas.
    slot.addEventListener("click", () => {
      const time = slot.getAttribute("data-slot-time");
      if (window.openTaskModal) {
        window.openTaskModal({ date: currentDate, time });
      }
    });
  });

  // Continuação de uma tarefa longa herda a cor da tarefa
  (function paintContinuations() {
    let current = null;
    document.querySelectorAll(".day-slots > *").forEach((el) => {
      if (el.classList.contains("slot-continues")) {
        if (current) {
          el.classList.add("is-cont");
          current.classList.add("has-cont");
          const nxt = el.nextElementSibling;
          if (!nxt || !nxt.classList.contains("slot-continues")) el.classList.add("is-last");
          const pr = [...current.classList].find((c) => c.startsWith("priority-"));
          if (pr) el.classList.add(pr);
        }
      } else {
        current = el.classList.contains("slot-tarefa") ? el : null;
      }
    });
  })();

  // ---------- Linha do "agora" ----------
  (function markNow() {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const box = document.querySelector(".day-slots");
    if (!box || iso !== currentDate) return;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const slots = [...box.children];
    let anchor = null;
    slots.forEach((el) => {
      const t = el.querySelector(".slot-time");
      if (t && /^\d\d:\d\d$/.test(t.textContent.trim()) && toMin(t.textContent.trim()) <= nowMin) anchor = el;
    });
    if (!anchor) return;
    while (anchor.nextElementSibling && anchor.nextElementSibling.classList.contains("slot-continues")) {
      anchor = anchor.nextElementSibling;
    }
    const line = document.createElement("div");
    line.className = "now-line";
    line.innerHTML = `<span>${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}</span>`;
    anchor.after(line);
    setTimeout(() => line.scrollIntoView({ block: "center", behavior: "smooth" }), 400);
  })();

  // ---------- Organizar meu dia ----------
  const organizeBtn = document.getElementById("organizeDayBtn");
  const overlay = document.getElementById("organizeModalOverlay");
  const body = document.getElementById("organizeModalBody");
  const applyBtn = document.getElementById("organizeApplyBtn");
  const cancelBtn = document.getElementById("organizeCancelBtn");
  const closeBtn = document.getElementById("organizeModalClose");

  function renderSuggestions(data) {
    if (data.error) {
      body.innerHTML = `<p class="empty-hint">${data.error}</p>`;
      applyBtn.style.display = "none";
      return;
    }
    if (!data.suggestions.length) {
      body.innerHTML = `<p class="empty-hint">Não há tarefas sem horário para organizar hoje.</p>`;
      applyBtn.style.display = "none";
      return;
    }
    let html = '<div class="bar-list">';
    data.suggestions.forEach((s) => {
      html += `<div class="compare-row"><span>${s.suggested_time} — ${s.name}</span><strong>${window.formatMinutesShort(s.estimated_minutes)}</strong></div>`;
    });
    if (data.unfit && data.unfit.length) {
      html += `<p class="field-label" style="margin-top:10px;">Não coube na jornada de hoje:</p>`;
      data.unfit.forEach((s) => {
        html += `<div class="compare-row"><span>${s.name}</span><strong class="text-danger">${window.formatMinutesShort(s.estimated_minutes)}</strong></div>`;
      });
    }
    html += "</div>";
    body.innerHTML = html;
    applyBtn.style.display = "inline-flex";
  }

  if (organizeBtn) {
    organizeBtn.addEventListener("click", async () => {
      overlay.classList.add("is-open");
      body.innerHTML = '<p class="empty-hint">Calculando...</p>';
      applyBtn.style.display = "none";
      const res = await fetch("/api/planning/day/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: currentDate, apply: false }),
      });
      renderSuggestions(await res.json());
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", async () => {
      await fetch("/api/planning/day/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: currentDate, apply: true }),
      });
      window.showToast && window.showToast("Dia organizado.");
      window.location.reload();
    });
  }

  function close() { overlay.classList.remove("is-open"); }
  if (cancelBtn) cancelBtn.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
})();
