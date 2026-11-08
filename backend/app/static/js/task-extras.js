// Subtarefas e notas ligadas, dentro do modal de editar tarefa.
(function () {
  const box = document.getElementById("taskExtras");
  if (!box) return;
  const $ = (id) => document.getElementById(id);
  const list = $("subList"), input = $("subInput"), bar = $("subBar"), progress = $("subProgress");
  const linked = $("linkedNotes"), select = $("linkSelect");
  let task = null, changed = false;

  async function api(method, url, body) {
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  /* ---------- Subtarefas ---------- */
  function updateProgress() {
    const items = [...list.children];
    const done = items.filter((li) => li.classList.contains("is-done")).length;
    progress.textContent = items.length ? `${done}/${items.length}` : "";
    bar.style.width = items.length ? (done / items.length) * 100 + "%" : "0%";
    bar.parentElement.hidden = !items.length;
  }

  function subtaskItem(sub) {
    const li = el("li", "subtask" + (sub.done ? " is-done" : ""));
    const check = el("button", "subtask-check");
    check.type = "button"; check.setAttribute("aria-label", "Marcar como feita");
    check.innerHTML = sub.done && window.Icons ? "✓" : "";
    const title = el("span", "subtask-title", sub.title);
    const del = el("button", "subtask-del", "×");
    del.type = "button"; del.title = "Excluir subtarefa";
    check.addEventListener("click", async () => {
      sub.done = !sub.done;
      li.classList.toggle("is-done", sub.done);
      check.textContent = sub.done ? "✓" : "";
      updateProgress(); changed = true;
      await api("PUT", `/api/subtasks/${sub.id}`, { done: sub.done });
    });
    del.addEventListener("click", async () => {
      li.remove(); updateProgress(); changed = true;
      await api("DELETE", `/api/subtasks/${sub.id}`);
    });
    li.append(check, title, del);
    if (sub.done) check.textContent = "✓";
    return li;
  }

  async function addSubtask() {
    const title = input.value.trim();
    if (!title || !task) return;
    input.value = "";
    try {
      const sub = await api("POST", `/api/tasks/${task.id}/subtasks`, { title });
      list.append(subtaskItem(sub));
      updateProgress(); changed = true;
    } catch { window.showToast && window.showToast("Não foi possível adicionar."); }
    input.focus();
  }
  $("subAddBtn").addEventListener("click", addSubtask);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } });

  /* ---------- Notas ligadas ---------- */
  function noteItem(n) {
    const li = el("li");
    const a = el("a", "link", n.title);
    a.href = `/notas?open=${n.id}`;
    const un = el("button", "subtask-del", "desvincular");
    un.type = "button";
    un.addEventListener("click", async () => {
      await api("PUT", `/api/notes/${n.id}`, { task_id: null });
      li.remove(); select.append(new Option(n.title, n.id)); changed = true;
    });
    li.append(a, un);
    return li;
  }

  select.addEventListener("change", async () => {
    const id = Number(select.value);
    if (!id) return;
    const opt = select.selectedOptions[0];
    await api("PUT", `/api/notes/${id}`, { task_id: task.id });
    linked.append(noteItem({ id, title: opt.textContent }));
    opt.remove(); select.value = ""; changed = true;
  });

  $("newLinkedNote").addEventListener("click", async () => {
    const note = await api("POST", "/api/notes", { title: task.name, content: "", task_id: task.id });
    window.location.href = `/notas?open=${note.id}`;
  });

  /* ---------- Ciclo do modal ---------- */
  document.addEventListener("taskmodal:open", async (e) => {
    task = e.detail; changed = false;
    box.hidden = !task;
    if (!task) return;
    list.replaceChildren(); linked.replaceChildren();
    select.replaceChildren(new Option("Vincular nota existente…", ""));
    try {
      const data = await api("GET", `/api/tasks/${task.id}/extras`);
      data.subtasks.forEach((s) => list.append(subtaskItem(s)));
      data.notes.forEach((n) => linked.append(noteItem(n)));
      data.available_notes.forEach((n) => select.append(new Option(n.title, n.id)));
      updateProgress();
    } catch { /* sem extras: o formulário segue funcionando */ }
  });
  document.addEventListener("taskmodal:close", () => {
    if (changed) window.location.reload();  // atualiza o contador "2/5" na lista
    changed = false; task = null;
  });
})();
