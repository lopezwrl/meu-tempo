(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");

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

  const saved = localStorage.getItem("meutempo-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("meutempo-theme", next);
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
