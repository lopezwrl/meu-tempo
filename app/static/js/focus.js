(function () {
  const enableCheckbox = document.getElementById("pomodoroEnable");
  const body = document.getElementById("pomodoroBody");
  const cycleLabel = document.getElementById("pomodoroCycle");
  const phaseLabel = document.getElementById("pomodoroPhase");
  const timerLabel = document.getElementById("pomodoroTimer");
  const presetBtns = document.querySelectorAll("[data-preset]");
  const scriptTag = document.currentScript;

  if (!enableCheckbox) return;

  let focusMinutes = parseInt(scriptTag.getAttribute("data-focus-minutes") || "25", 10);
  let breakMinutes = parseInt(scriptTag.getAttribute("data-break-minutes") || "5", 10);
  let longBreakMinutes = parseInt(scriptTag.getAttribute("data-long-break-minutes") || "15", 10);
  const totalCycles = parseInt(scriptTag.getAttribute("data-cycles") || "4", 10);

  let currentCycle = 1;
  let phase = "foco"; // foco | pausa | pausa_longa
  let secondsLeft = focusMinutes * 60;
  let interval = null;

  function format(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function render() {
    cycleLabel.textContent = `${currentCycle}/${totalCycles}`;
    phaseLabel.textContent = phase === "foco" ? "Foco" : (phase === "pausa_longa" ? "Pausa longa" : "Pausa");
    timerLabel.textContent = format(secondsLeft);
  }

  function nextPhase() {
    if (phase === "foco") {
      const isLast = currentCycle >= totalCycles;
      phase = isLast ? "pausa_longa" : "pausa";
      secondsLeft = (isLast ? longBreakMinutes : breakMinutes) * 60;
      window.showToast && window.showToast(isLast ? "Pausa longa recomendada." : "Pausa recomendada.");
    } else {
      if (phase === "pausa_longa") {
        currentCycle = 1;
      } else {
        currentCycle += 1;
      }
      phase = "foco";
      secondsLeft = focusMinutes * 60;
      window.showToast && window.showToast("Hora de focar.");
    }
    render();
  }

  function tick() {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      nextPhase();
      return;
    }
    render();
  }

  enableCheckbox.addEventListener("change", () => {
    body.style.display = enableCheckbox.checked ? "block" : "none";
    if (enableCheckbox.checked && !interval) {
      render();
      interval = setInterval(tick, 1000);
    } else if (!enableCheckbox.checked && interval) {
      clearInterval(interval);
      interval = null;
    }
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const [f, b] = btn.getAttribute("data-preset").split(",").map(Number);
      focusMinutes = f;
      breakMinutes = b;
      phase = "foco";
      currentCycle = 1;
      secondsLeft = focusMinutes * 60;
      presetBtns.forEach((b2) => b2.classList.remove("is-active"));
      btn.classList.add("is-active");
      render();
    });
  });
})();
