// Detecção de ausência: quando você volta depois de muito tempo sem mexer no app
// e o cronômetro estava rodando, pergunta o que fazer com esse tempo.
(function () {
  const minutes = Number(document.currentScript.dataset.idleMinutes) || 0;
  if (minutes <= 0) return;
  const LIMIT = minutes * 60 * 1000;
  let last = Date.now();
  let busy = false;

  function onActivity() {
    const now = Date.now();
    const gap = now - last;
    last = now;
    if (gap >= LIMIT && !busy) ask(gap);
  }
  ["mousemove", "mousedown", "keydown", "scroll", "wheel", "touchstart", "focus"].forEach((ev) =>
    window.addEventListener(ev, onActivity, { passive: true }));

  async function ask(gap) {
    busy = true;
    let task = null;
    try {
      const data = await (await fetch("/api/timer/active")).json();
      task = data.active ? data.task : null;
    } catch (e) { /* sem servidor: não pergunta */ }
    if (!task) { busy = false; return; }

    const seconds = Math.round(gap / 1000);
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay is-open";
    overlay.innerHTML = `
      <div class="modal modal-small" role="dialog" aria-modal="true" aria-labelledby="idleTitle">
        <div class="modal-header"><h2 id="idleTitle">Bem-vindo de volta</h2></div>
        <p class="idle-text">Ficamos <strong></strong> sem detectar atividade, e o cronômetro de
          <strong class="idle-task"></strong> continuou rodando. O que fazer com esse tempo?</p>
        <div class="idle-actions">
          <button class="btn btn-primary" data-act="resume" type="button">Descontar e continuar</button>
          <button class="btn btn-ghost" data-act="pause" type="button">Descontar e pausar</button>
          <button class="btn btn-text" data-act="keep" type="button">Manter (eu estava trabalhando)</button>
        </div>
      </div>`;
    overlay.querySelector("strong").textContent = window.formatMinutesShort(seconds / 60);
    overlay.querySelector(".idle-task").textContent = task.name;
    document.body.append(overlay);
    overlay.querySelector("[data-act=resume]").focus();

    const finish = async (action) => {
      overlay.remove();
      try {
        await fetch("/api/timer/idle", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: task.id, seconds, action }),
        });
      } catch (e) { /* ignora */ }
      last = Date.now();
      busy = false;
      if (action === "keep") { window.showToast && window.showToast("Tempo mantido."); window.refreshActiveTimer && window.refreshActiveTimer(); }
      else { window.showToast && window.showToast("Tempo ausente descontado."); setTimeout(() => window.location.reload(), 500); }
    };
    overlay.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => finish(b.dataset.act)));
    overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") finish("keep"); });
  }
})();
