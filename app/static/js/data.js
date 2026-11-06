(function () {
  const btn = document.getElementById("restoreBtn");
  const input = document.getElementById("restoreInput");
  if (!btn || !input) return;
  btn.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files[0];
    input.value = "";
    if (!file) return;
    if (!confirm(`Restaurar "${file.name}"?\n\nISSO SUBSTITUI todos os dados atuais. Uma cópia do banco atual será guardada em instance/backups.`)) return;
    let payload;
    try { payload = JSON.parse(await file.text()); } catch { return window.showToast("Arquivo inválido."); }
    const res = await fetch("/api/backup/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return window.showToast(data.error || "Falha ao restaurar.");
    window.showToast("Backup restaurado.");
    setTimeout(() => (window.location.href = "/"), 900);
  });
})();

(function () {
  const input = document.getElementById("idleMinutes");
  const save = document.getElementById("idleSave");
  if (!input || !save) return;
  save.addEventListener("click", async () => {
    const res = await fetch("/api/settings/idle", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes: input.value }),
    });
    const data = await res.json().catch(() => ({}));
    window.showToast(res.ok ? "Salvo. Vale a partir da próxima página." : (data.error || "Não foi possível salvar."));
  });
})();
