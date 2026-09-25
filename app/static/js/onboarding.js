(function () {
  const root = document.getElementById("onboarding");
  if (!root) return;
  const steps = [...root.querySelectorAll(".ob-step")];
  const dots = [...root.querySelectorAll(".ob-dots i")];
  const back = document.getElementById("obBack");
  const next = document.getElementById("obNext");
  let index = 0;

  function show(i) {
    index = i;
    steps.forEach((s, n) => s.classList.toggle("is-active", n === i));
    dots.forEach((d, n) => d.classList.toggle("is-on", n <= i));
    back.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? "Começar" : "Continuar";
    const input = steps[i].querySelector("input");
    if (input) input.focus();
  }

  async function finish(skip) {
    const body = skip ? { skip: true } : {
      name: document.getElementById("obName").value,
      workday_start: document.getElementById("obStart").value,
      workday_end: document.getElementById("obEnd").value,
      notebook: document.getElementById("obNotebook").value,
    };
    try {
      await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch (e) { /* segue mesmo assim */ }
    root.classList.add("is-leaving");
    setTimeout(() => window.location.reload(), 350);
  }

  next.addEventListener("click", () => (index < steps.length - 1 ? show(index + 1) : finish(false)));
  back.addEventListener("click", () => show(index - 1));
  document.getElementById("obSkip").addEventListener("click", () => finish(true));
  root.addEventListener("keydown", (e) => { if (e.key === "Enter") next.click(); });

  // Espera a abertura animada terminar antes de aparecer
  const splashGone = document.documentElement.classList.contains("no-splash") ? 0 : 1900;
  setTimeout(() => { root.classList.add("is-open"); show(0); }, splashGone);
})();
