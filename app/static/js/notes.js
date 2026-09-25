(function () {
  const COLORS = ["#E76F6F", "#E9B44C", "#4FB286", "#4A90D9", "#8A6FB3", "#D98A3D", "#2F6F6B", "#7A8794"];
  const EMPTY = {
    recent: ["Nenhuma nota por aqui ainda.", "file-text"],
    pinned: ["Fixe as notas importantes para vê-las aqui.", "pin"],
    archived: ["O arquivo está vazio.", "archive"],
  };
  const state = { notebooks: [], notes: [], notebook: "all", view: "recent", q: "" };

  const $ = (id) => document.getElementById(id);
  const row = $("notebookRow"), grid = $("notesGrid"), toolbar = $("notebookToolbar");
  const statusEl = $("saveStatus");

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  const iconBtn = (name, title, cls) => {
    const b = el("button", "note-action " + (cls || ""));
    b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
    b.innerHTML = window.Icons[name];
    return b;
  };
  const short = (t) => (t || "agora").replace(/\/\d{4}/, "");
  const nbById = (id) => state.notebooks.find((n) => n.id === id);
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  let statusTimer;
  function setStatus(text) {
    statusEl.textContent = text;
    clearTimeout(statusTimer);
    if (text === "Salvo") statusTimer = setTimeout(() => (statusEl.textContent = ""), 2000);
  }

  /* ---------- Cadernos ---------- */
  function counts() {
    const live = state.notes.filter((n) => !n.archived);
    const by = {};
    live.forEach((n) => { by[n.notebook_id] = (by[n.notebook_id] || 0) + 1; });
    return { all: live.length, by };
  }

  function renderNotebooks() {
    const c = counts();
    row.replaceChildren();
    const tile = (id, name, count, color) => {
      const b = el("button", "notebook-tile" + (state.notebook === id ? " is-active" : ""));
      b.type = "button";
      b.style.setProperty("--nb", color);
      b.append(el("span", "notebook-tile-name", name), el("span", "notebook-tile-count", count + (count === 1 ? " nota" : " notas")));
      b.addEventListener("click", () => { state.notebook = id; renderAll(); });
      return b;
    };
    row.append(tile("all", "Todas", c.all, "#7A8794"));
    state.notebooks.forEach((nb) => row.append(tile(nb.id, nb.name, c.by[nb.id] || 0, nb.color)));
    const add = el("button", "notebook-tile notebook-tile-add");
    add.type = "button";
    add.append(el("span", "notebook-tile-name", "+ Novo caderno"));
    add.addEventListener("click", createNotebook);
    row.append(add);

    const nb = state.notebook === "all" ? null : nbById(state.notebook);
    toolbar.hidden = !nb;
    if (nb) {
      $("notebookName").value = nb.name;
      const sw = $("notebookSwatches");
      sw.replaceChildren();
      COLORS.forEach((col) => {
        const s = el("button", "swatch" + (col === nb.color ? " is-active" : ""));
        s.type = "button"; s.style.background = col; s.setAttribute("aria-label", "Cor " + col);
        s.addEventListener("click", async () => { nb.color = col; renderNotebooks(); renderNotes(); await api("PUT", `/api/notebooks/${nb.id}`, { color: col }); });
        sw.append(s);
      });
    }
  }

  async function createNotebook() {
    const nb = await api("POST", "/api/notebooks", { name: "Novo caderno" });
    state.notebooks.push(nb);
    state.notebook = nb.id;
    renderAll();
    const input = $("notebookName");
    input.focus(); input.select();
  }

  const saveNotebookName = debounce(async () => {
    const nb = nbById(state.notebook);
    if (!nb) return;
    nb.name = $("notebookName").value.trim() || "Sem nome";
    await api("PUT", `/api/notebooks/${nb.id}`, { name: nb.name });
    renderNotebooks(); renderNotes();
  }, 600);
  $("notebookName").addEventListener("input", saveNotebookName);

  $("notebookDelete").addEventListener("click", async () => {
    const nb = nbById(state.notebook);
    if (!nb || !confirm(`Excluir o caderno "${nb.name}"? As notas dele não são apagadas.`)) return;
    await api("DELETE", `/api/notebooks/${nb.id}`);
    state.notes.forEach((n) => { if (n.notebook_id === nb.id) n.notebook_id = null; });
    state.notebooks = state.notebooks.filter((n) => n.id !== nb.id);
    state.notebook = "all";
    renderAll();
  });

  /* ---------- Notas ---------- */
  function visibleNotes() {
    const q = state.q.toLowerCase();
    return state.notes.filter((n) => {
      if (state.notebook !== "all" && n.notebook_id !== state.notebook) return false;
      if (state.view === "archived" ? !n.archived : n.archived) return false;
      if (state.view === "pinned" && !n.pinned) return false;
      return !q || (n.title || "").toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q);
    });
  }

  const saveNote = debounce(async (note) => {
    setStatus("Salvando…");
    try {
      const saved = await api("PUT", `/api/notes/${note.id}`, { title: note.title, content: note.content });
      note.updated_at = saved.updated_at;
      const stamp = document.querySelector(`[data-note-id="${note.id}"] .note-updated`);
      if (stamp) stamp.textContent = short(saved.updated_at);
      setStatus("Salvo");
    } catch { setStatus("Erro ao salvar"); }
  }, 600);

  async function flushNote(note) {
    setStatus("Salvando…");
    try {
      const saved = await api("PUT", `/api/notes/${note.id}`, { title: note.title, content: note.content });
      note.updated_at = saved.updated_at;
      setStatus("Salvo");
    } catch { setStatus("Erro ao salvar"); }
  }

  async function patch(note, changes) {
    Object.assign(note, changes);
    renderAll();
    await api("PUT", `/api/notes/${note.id}`, changes);
  }

  function noteCard(note) {
    const nb = nbById(note.notebook_id);
    const card = el("article", "note-card" + (note.pinned ? " is-pinned" : ""));
    card.dataset.noteId = note.id;
    card.style.setProperty("--nb", nb ? nb.color : "#7A8794");

    const title = el("input", "note-title-input");
    title.value = note.title || ""; title.placeholder = "Sem título";
    title.addEventListener("input", () => { note.title = title.value; saveNote(note); });
    const pin = iconBtn("pin", note.pinned ? "Desafixar" : "Fixar", note.pinned ? "is-active" : "");
    pin.addEventListener("click", () => patch(note, { pinned: !note.pinned }));
    const top = el("div", "note-card-top"); top.append(title, pin);
    let taskChip = null;
    if (note.task_name) {
      taskChip = el("a", "note-task-chip", "Tarefa: " + note.task_name);
      taskChip.href = "/tarefas"; taskChip.title = "Nota ligada a esta tarefa";
    }

    const body = el("textarea", "note-content-input");
    body.value = note.content || ""; body.placeholder = "Escreva algo…";
    const grow = () => { body.style.height = "auto"; body.style.height = Math.min(body.scrollHeight, 320) + "px"; };
    body.addEventListener("input", () => { note.content = body.value; grow(); saveNote(note); });
    requestAnimationFrame(grow);

    const select = el("select", "note-notebook-select");
    select.title = "Mover para outro caderno";
    select.append(new Option("Sem caderno", ""));
    state.notebooks.forEach((n) => select.append(new Option(n.name, n.id, false, n.id === note.notebook_id)));
    select.addEventListener("change", () => patch(note, { notebook_id: select.value ? Number(select.value) : null }));

    const open = iconBtn("expand", "Abrir em tela cheia (Markdown)");
    open.addEventListener("click", () => window.NoteEditor.open(note, { save: saveNote, saveNow: flushNote, close: renderAll }));
    const exp = iconBtn("download", "Exportar como .md");
    exp.addEventListener("click", () => { window.location.href = `/api/notes/${note.id}/export`; });
    const arch = iconBtn("archive", note.archived ? "Desarquivar" : "Arquivar");
    arch.addEventListener("click", () => patch(note, { archived: !note.archived }));
    const del = iconBtn("trash", "Excluir", "is-danger");
    del.addEventListener("click", async () => {
      if (!confirm("Excluir esta nota?")) return;
      state.notes = state.notes.filter((n) => n.id !== note.id);
      renderAll();
      await api("DELETE", `/api/notes/${note.id}`);
    });

    const foot = el("div", "note-card-footer");
    const actions = el("div", "note-actions"); actions.append(open, exp, arch, del);
    foot.append(select, el("span", "note-updated", short(note.updated_at)), actions);
    card.append(top, ...(taskChip ? [taskChip] : []), body, foot);
    return card;
  }

  function renderNotes() {
    const list = visibleNotes();
    grid.replaceChildren(...list.map(noteCard));
    grid.querySelectorAll(".note-card").forEach((c, i) => c.style.setProperty("--i", Math.min(i, 12)));
    const empty = $("notesEmpty");
    empty.hidden = list.length > 0;
    if (!list.length) {
      const [text, icon] = state.q ? ["Nada encontrado para essa busca.", "search"] : EMPTY[state.view];
      $("emptyText").textContent = text;
      $("emptyIcon").innerHTML = window.Icons[icon] || "";
    }
  }

  function renderExportLink() {
    $("exportBtn").href = "/api/export?notebook=" + state.notebook;
  }

  async function importFiles(files) {
    const valid = [...files].filter((f) => /\.(md|markdown|txt)$/i.test(f.name));
    if (!valid.length) return window.showToast && window.showToast("Use arquivos .md ou .txt.");
    const notebook_id = state.notebook === "all" ? (state.notebooks[0] || {}).id || null : state.notebook;
    for (const file of valid) {
      let text = (await file.text()).replace(/^\uFEFF/, "");
      let title = file.name.replace(/\.[^.]+$/, "");
      const m = text.match(/^#\s+(.+)\n+/);   // "# Título" na primeira linha vira o título da nota
      if (m) { title = m[1].trim(); text = text.slice(m[0].length); }
      state.notes.unshift(await api("POST", "/api/notes", { title, content: text, notebook_id }));
    }
    state.view = "recent";
    renderAll();
    window.showToast && window.showToast(valid.length === 1 ? "1 nota importada." : `${valid.length} notas importadas.`);
  }

  function renderAll() {
    renderExportLink();
    renderNotebooks();
    document.querySelectorAll("#viewTabs button").forEach((b) => b.classList.toggle("is-active", b.dataset.view === state.view));
    renderNotes();
  }

  async function createNote() {
    const notebook_id = state.notebook === "all" ? (state.notebooks[0] || {}).id || null : state.notebook;
    const note = await api("POST", "/api/notes", { title: "", content: "", notebook_id });
    state.notes.unshift(note);
    state.view = "recent"; state.q = ""; $("noteSearch").value = "";
    renderAll();
    const first = grid.querySelector(".note-title-input");
    if (first) first.focus();
  }

  $("newNoteBtn").addEventListener("click", createNote);
  $("importBtn").addEventListener("click", () => $("importInput").click());
  $("importInput").addEventListener("change", (e) => { importFiles(e.target.files); e.target.value = ""; });
  let dragDepth = 0;
  const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes("Files");
  document.addEventListener("dragenter", (e) => { if (hasFiles(e)) { dragDepth++; document.body.classList.add("is-dragging"); } });
  document.addEventListener("dragleave", (e) => { if (hasFiles(e) && --dragDepth <= 0) { dragDepth = 0; document.body.classList.remove("is-dragging"); } });
  document.addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
  document.addEventListener("drop", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; document.body.classList.remove("is-dragging");
    importFiles(e.dataTransfer.files);
  });
  $("noteSearch").addEventListener("input", (e) => { state.q = e.target.value; renderNotes(); });
  document.querySelectorAll("#viewTabs button").forEach((b) =>
    b.addEventListener("click", () => { state.view = b.dataset.view; renderAll(); }));
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("noteSearch").focus(); }
  });

  Promise.all([api("GET", "/api/notebooks"), api("GET", "/api/notes")]).then(([nbs, notes]) => {
    state.notebooks = nbs; state.notes = notes; renderAll();
    const wanted = Number(new URLSearchParams(location.search).get("open"));
    const target = wanted && state.notes.find((n) => n.id === wanted);
    if (target) {
      state.notebook = "all"; state.view = target.archived ? "archived" : "recent"; renderAll();
      window.NoteEditor.open(target, { save: saveNote, saveNow: flushNote, close: renderAll });
      history.replaceState(null, "", "/notas");
    }
  });
})();
