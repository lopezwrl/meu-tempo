// Interações específicas do dashboard (Fase 3): mover tarefa sobrecarregada para amanhã.
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-postpone-task]");
  if (!btn) return;
  const id = btn.getAttribute("data-postpone-task");
  await fetch(`/api/tasks/${id}/postpone`, { method: "POST" });
  window.showToast && window.showToast("Tarefa movida para amanhã.");
  window.location.reload();
});
