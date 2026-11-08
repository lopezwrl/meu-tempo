(function () {
  const overlay = document.getElementById("taskModalOverlay");
  if (!overlay) return;

  const form = document.getElementById("taskForm");
  const modalTitle = document.getElementById("taskModalTitle");
  const submitBtn = document.getElementById("taskSubmitBtn");
  const deleteBtn = document.getElementById("taskDeleteBtn");
  const cancelBtn = document.getElementById("taskCancelBtn");
  const closeBtn = document.getElementById("taskModalClose");
  const estimateHint = document.getElementById("estimateHint");

  const fields = {
    id: document.getElementById("taskId"),
    name: document.getElementById("taskName"),
    category: document.getElementById("taskCategory"),
    project: document.getElementById("taskProject"),
    priority: document.getElementById("taskPriority"),
    date: document.getElementById("taskDate"),
    time: document.getElementById("taskTime"),
    deadline: document.getElementById("taskDeadline"),
    estimate: document.getElementById("taskEstimate"),
    description: document.getElementById("taskDescription"),
    tags: document.getElementById("taskTags"),
    observations: document.getElementById("taskObservations"),
  };

  function openModal(task) {
    form.reset();
    estimateHint.textContent = "";
    if (task && task.id) {
      modalTitle.textContent = "Editar tarefa";
      submitBtn.textContent = "Salvar alterações";
      deleteBtn.style.display = "inline-flex";
      fields.id.value = task.id;
      fields.name.value = task.name || "";
      fields.category.value = task.category_id || "";
      fields.project.value = task.project_id || "";
      fields.priority.value = task.priority || "media";
      fields.date.value = task.date || "";
      fields.time.value = task.time || "";
      fields.deadline.value = task.deadline_time || "";
      fields.estimate.value = task.estimated_minutes || "";
      fields.description.value = task.description || "";
      fields.tags.value = (task.tags || []).join(", ");
      fields.observations.value = task.observations || "";
    } else {
      // Tarefa nova — pode vir com data/horário pré-preenchidos (ex.: clique
      // num horário livre da timeline em Meu Dia).
      modalTitle.textContent = "Nova tarefa";
      submitBtn.textContent = "Adicionar tarefa";
      deleteBtn.style.display = "none";
      fields.id.value = "";
      const todayIso = new Date().toISOString().slice(0, 10);
      fields.date.value = (task && task.date) || todayIso;
      fields.time.value = (task && task.time) || "";
    }
    overlay.classList.add("is-open");
    fields.name.focus();
    document.dispatchEvent(new CustomEvent("taskmodal:open", { detail: task && task.id ? task : null }));
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    document.dispatchEvent(new CustomEvent("taskmodal:close"));
  }

  window.openTaskModal = openModal;

  document.querySelectorAll("#openNewTask, #emptyStateNewTask").forEach((btn) => {
    btn.addEventListener("click", () => openModal(null));
  });

  document.querySelectorAll("[data-open-task]").forEach((el) => {
    el.addEventListener("click", async () => {
      const id = el.getAttribute("data-open-task");
      const res = await fetch("/api/tasks");
      const tasks = await res.json();
      const task = tasks.find((t) => String(t.id) === String(id));
      if (task) openModal(task);
    });
  });

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.querySelectorAll("[data-complete-toggle]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-task-id");
      const isChecked = btn.classList.contains("is-checked");
      const endpoint = isChecked ? `/api/tasks/${id}/reopen` : `/api/tasks/${id}/complete`;
      await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" } });
      window.location.reload();
    });
  });

  let estimateTimer = null;
  function fetchEstimateHint() {
    clearTimeout(estimateTimer);
    estimateTimer = setTimeout(async () => {
      const name = fields.name.value.trim();
      const categoryId = fields.category.value;
      if (!name) {
        estimateHint.textContent = "";
        return;
      }
      const params = new URLSearchParams({ name });
      if (categoryId) params.set("category_id", categoryId);
      const res = await fetch(`/api/tasks/estimate?${params.toString()}`);
      const data = await res.json();
      if (data && data.average_minutes) {
        estimateHint.textContent = `Com base no seu histórico, tarefas parecidas levam cerca de ${data.average_minutes} min.`;
      } else {
        estimateHint.textContent = "";
      }
    }, 400);
  }
  fields.name.addEventListener("input", fetchEstimateHint);
  fields.category.addEventListener("change", fetchEstimateHint);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = fields.id.value;
    const payload = {
      name: fields.name.value.trim(),
      category_id: fields.category.value || null,
      project_id: fields.project.value || null,
      priority: fields.priority.value,
      date: fields.date.value || null,
      time: fields.time.value || null,
      deadline_time: fields.deadline.value || null,
      estimated_minutes: fields.estimate.value || null,
      description: fields.description.value || null,
      tags: fields.tags.value || null,
      observations: fields.observations.value || null,
    };

    const url = id ? `/api/tasks/${id}` : "/api/tasks";
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      window.showToast(id ? "Tarefa atualizada." : "Tarefa criada.");
      window.location.reload();
    } else {
      const err = await res.json();
      window.showToast(err.error || "Não foi possível salvar a tarefa.");
    }
  });

  deleteBtn.addEventListener("click", async () => {
    const id = fields.id.value;
    if (!id) return;
    if (!confirm("Excluir esta tarefa? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    window.showToast("Tarefa excluída.");
    window.location.reload();
  });
})();
