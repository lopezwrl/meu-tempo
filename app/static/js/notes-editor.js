// Editor em tela cheia com pré-visualização de Markdown (renderizador próprio, com HTML escapado).
window.NoteEditor = (function () {
  const root = document.getElementById("noteEditor");
  if (!root) return { open() {} };
  const titleEl = document.getElementById("neTitle");
  const bodyEl = document.getElementById("neBody");
  const previewEl = document.getElementById("nePreview");
  const metaEl = document.getElementById("neMeta");
  let note = null, hooks = {};

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return s;
  }

  function markdown(src) {
    const out = [];
    let list = null, para = [], code = null;
    const flush = () => { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } };
    const closeList = () => { if (list) { out.push("</" + list + ">"); list = null; } };
    const openList = (kind, cls) => { if (list !== kind) { closeList(); out.push("<" + kind + (cls ? ` class="${cls}"` : "") + ">"); list = kind; } };
    for (const raw of src.split("\n")) {
      if (code !== null) {
        if (/^```/.test(raw)) { out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>"); code = null; } else code.push(raw);
        continue;
      }
      if (/^```/.test(raw)) { flush(); closeList(); code = []; continue; }
      if (!raw.trim()) { flush(); closeList(); continue; }
      let m;
      if ((m = raw.match(/^(#{1,3})\s+(.*)/))) { flush(); closeList(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
      if ((m = raw.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)/))) { flush(); openList("ul", "checklist"); out.push(`<li class="task${m[1] === " " ? "" : " done"}"><span class="box"></span>${inline(m[2])}</li>`); continue; }
      if ((m = raw.match(/^\s*[-*]\s+(.*)/))) { flush(); openList("ul"); out.push("<li>" + inline(m[1]) + "</li>"); continue; }
      if ((m = raw.match(/^\s*\d+\.\s+(.*)/))) { flush(); openList("ol"); out.push("<li>" + inline(m[1]) + "</li>"); continue; }
      if ((m = raw.match(/^>\s?(.*)/))) { flush(); closeList(); out.push("<blockquote>" + inline(m[1]) + "</blockquote>"); continue; }
      if (/^---+$/.test(raw.trim())) { flush(); closeList(); out.push("<hr>"); continue; }
      closeList();
      para.push(raw.trim());
    }
    if (code !== null) out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
    flush(); closeList();
    return out.join("\n") || '<p class="ne-placeholder">A pré-visualização aparece aqui.</p>';
  }

  const words = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);
  function refresh() {
    previewEl.innerHTML = markdown(bodyEl.value);
    const n = words(bodyEl.value);
    metaEl.textContent = `${n} ${n === 1 ? "palavra" : "palavras"}`;
  }

  function close() {
    root.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    if (hooks.saveNow && note) hooks.saveNow(note);
    if (hooks.close) hooks.close();
    note = null;
  }

  titleEl.addEventListener("input", () => { note.title = titleEl.value; hooks.save(note); });
  bodyEl.addEventListener("input", () => { note.content = bodyEl.value; hooks.save(note); refresh(); });
  root.querySelectorAll("[data-ne-view]").forEach((b) => b.addEventListener("click", () => {
    root.dataset.view = b.dataset.neView;
    root.querySelectorAll("[data-ne-view]").forEach((x) => x.classList.toggle("is-active", x === b));
  }));
  document.getElementById("neClose").addEventListener("click", close);
  root.addEventListener("mousedown", (e) => { if (e.target === root) close(); });
  document.addEventListener("keydown", (e) => {
    if (!note) return;
    if (e.key === "Escape") close();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); hooks.saveNow && hooks.saveNow(note); }
  });

  return {
    open(n, h) {
      note = n; hooks = h;
      titleEl.value = n.title || "";
      bodyEl.value = n.content || "";
      root.dataset.view = "split";
      root.querySelectorAll("[data-ne-view]").forEach((x) => x.classList.toggle("is-active", x.dataset.neView === "split"));
      refresh();
      root.classList.add("is-open");
      document.body.classList.add("no-scroll");
      bodyEl.focus();
    },
  };
})();
