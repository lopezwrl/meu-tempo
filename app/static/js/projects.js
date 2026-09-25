(function () {
  const overlay = document.getElementById("projectModalOverlay");
  if (!overlay) return;

  const form = document.getElementById("projectForm");
  const closeBtn = document.getElementById("projectModalClose");
  const cancelBtn = document.getElementById("projectCancelBtn");

  function open() {
    form.reset();
    overlay.classList.add("is-open");
  }
  function close() {
    overlay.classList.remove("is-open");
  }

  document.querySelectorAll("#openNewProject, #emptyStateNewProject").forEach((btn) => {
    btn.addEventListener("click", open);
  });
  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("projectName").value.trim(),
      description: document.getElementById("projectDescription").value || null,
      deadline: document.getElementById("projectDeadline").value || null,
      estimated_minutes: document.getElementById("projectEstimate").value || null,
    };
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      window.showToast && window.showToast("Projeto criado.");
      window.location.reload();
    } else {
      const err = await res.json();
      window.showToast && window.showToast(err.error || "Não foi possível criar o projeto.");
    }
  });
})();
