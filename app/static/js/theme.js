(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");

  function applyAccent(accent) {
    const next = accent || "rose";
    root.setAttribute("data-accent", next);
    localStorage.setItem("meutempo-accent", next);
    window.dispatchEvent(new CustomEvent("accentchange", { detail: next }));
    window.dispatchEvent(new CustomEvent("themechange", { detail: root.getAttribute("data-theme") || "light" }));
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
    if (icon && label) {
      if (theme === "dark") {
        icon.innerHTML = window.Icons ? window.Icons.sun : "";
        label.textContent = "Modo claro";
      } else {
        icon.innerHTML = window.Icons ? window.Icons.moon : "";
        label.textContent = "Modo escuro";
      }
    }
  }

  const savedAccent = localStorage.getItem("meutempo-accent") || "rose";
  const saved = localStorage.getItem("meutempo-theme") === "dark" ? "dark" : "light";
  applyAccent(savedAccent);
  applyTheme(saved);
  localStorage.setItem("meutempo-theme", saved);

  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("meutempo-theme", next);
    });
  }

  if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const motionTargets = document.querySelectorAll(
      ".stat-card, .panel, .task-row, .project-card, .notebook-tile, .day-slot, .dock-item, .chip, .achievement-pill"
    );

    motionTargets.forEach((element) => {
      element.addEventListener("pointerenter", () => {
        element.style.setProperty("--hover-lift", "-2px");
      });

      element.addEventListener("pointerleave", () => {
        element.style.setProperty("--hover-lift", "0px");
      });
    });
  }

  window.showToast = function (message) {
    const stack = document.getElementById("toastStack");
    if (!stack) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  };
})();
