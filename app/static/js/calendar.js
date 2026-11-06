(function () {
  document.querySelectorAll("[data-calendar-day]").forEach((cell) => {
    cell.addEventListener("click", (e) => {
      if (e.target.closest("a")) return; // deixa o link "ver dia" funcionar normalmente
      const date = cell.getAttribute("data-calendar-day");
      if (window.openTaskModal) window.openTaskModal({ date });
    });
  });
})();
