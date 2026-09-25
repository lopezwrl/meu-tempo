(function () {
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Menu "Mais" do dock
  const btn = document.getElementById("moreBtn");
  const menu = document.getElementById("moreMenu");
  if (btn && menu) {
    const set = (open) => { menu.hidden = !open; btn.setAttribute("aria-expanded", String(open)); };
    btn.addEventListener("click", (e) => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener("click", (e) => { if (!menu.contains(e.target)) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  }

  // Saudação conforme a hora
  const hello = document.querySelector("[data-greeting]");
  if (hello) {
    const h = new Date().getHours();
    hello.textContent = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  }

  // Números que "contam" até o valor final
  if (!reduce) {
    document.querySelectorAll(".stat-value").forEach((el) => {
      const m = el.textContent.trim().match(/^(\d+)(%?)$/);
      if (!m) return;
      const end = Number(m[1]), suffix = m[2], start = performance.now(), dur = 700;
      if (end === 0) return;
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = "0" + suffix;
      requestAnimationFrame(tick);
    });
  }
})();
