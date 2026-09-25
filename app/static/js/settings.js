(function () {
  // ---------- Jornada de trabalho ----------
  const saveBtn = document.getElementById("saveScheduleBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const rows = document.querySelectorAll("#scheduleBody tr");
      const payload = Array.from(rows).map((row) => ({
        weekday: row.getAttribute("data-weekday"),
        is_working_day: row.querySelector('[data-field="is_working_day"]').checked,
        start_time: row.querySelector('[data-field="start_time"]').value || "08:00",
        end_time: row.querySelector('[data-field="end_time"]').value || "18:00",
        lunch_start: row.querySelector('[data-field="lunch_start"]').value || null,
        lunch_end: row.querySelector('[data-field="lunch_end"]').value || null,
      }));
      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        window.showToast && window.showToast("Jornada salva.");
      } else {
        window.showToast && window.showToast("Não foi possível salvar a jornada.");
      }
    });
  }

  // ---------- Compromissos fixos ----------
  const recurringSelect = document.getElementById("commitmentRecurring");
  const weekdayField = document.getElementById("commitmentWeekdayField");
  const dateField = document.getElementById("commitmentDateField");

  function toggleCommitmentFields() {
    const isRecurring = recurringSelect.value === "1";
    weekdayField.style.display = isRecurring ? "flex" : "none";
    dateField.style.display = isRecurring ? "none" : "flex";
  }
  if (recurringSelect) {
    recurringSelect.addEventListener("change", toggleCommitmentFields);
    toggleCommitmentFields();
  }

  const form = document.getElementById("commitmentForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const isRecurring = recurringSelect.value === "1";
      const payload = {
        name: document.getElementById("commitmentName").value.trim(),
        recurring: isRecurring,
        weekday: isRecurring ? document.getElementById("commitmentWeekday").value : null,
        specific_date: isRecurring ? null : document.getElementById("commitmentDate").value,
        start_time: document.getElementById("commitmentStart").value,
        end_time: document.getElementById("commitmentEnd").value,
      };
      const res = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        window.showToast && window.showToast("Compromisso adicionado.");
        window.location.reload();
      } else {
        const err = await res.json();
        window.showToast && window.showToast(err.error || "Não foi possível adicionar o compromisso.");
      }
    });
  }

  document.querySelectorAll("[data-delete-commitment]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-delete-commitment");
      if (!confirm("Excluir este compromisso fixo?")) return;
      await fetch(`/api/commitments/${id}`, { method: "DELETE" });
      window.location.reload();
    });
  });
})();
