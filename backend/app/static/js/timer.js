(function () {
  function formatHMS(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  window.formatHMS = formatHMS;

  function formatMinutesShort(minutes) {
    minutes = Math.round(minutes);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h && m) return `${h}h${String(m).padStart(2, "0")}`;
    if (h) return `${h}h`;
    return `${m}min`;
  }
  window.formatMinutesShort = formatMinutesShort;

  // ---------- Estado global do cronômetro ----------
  let activeTask = null; // { id, name, worked_seconds, active_entry_start, estimated_minutes }
  let tickHandle = null;

  const widget = document.getElementById("globalTimer");
  const widgetTask = document.getElementById("globalTimerTask");
  const widgetClock = document.getElementById("globalTimerClock");
  const widgetPause = document.getElementById("globalTimerPause");
  const widgetFinish = document.getElementById("globalTimerFinish");

  function renderWidget() {
    if (!widget) return;
    if (activeTask) {
      widget.style.display = "flex";
      widgetTask.textContent = activeTask.name;
      widgetClock.textContent = formatHMS(activeTask.worked_seconds);
    } else {
      widget.style.display = "none";
    }
    document.querySelectorAll("[data-task-row]").forEach((row) => {
      const isThis = activeTask && String(row.getAttribute("data-task-row")) === String(activeTask.id);
      row.classList.toggle("is-running", !!isThis);
    });
    if (activeTask) {
      const liveClock = document.querySelector(`[data-live-clock="${activeTask.id}"]`);
      if (liveClock) liveClock.textContent = formatHMS(activeTask.worked_seconds);
    }
  }

  function tick() {
    if (activeTask) {
      activeTask.worked_seconds += 1;
      renderWidget();
      const liveClock = document.querySelector(`[data-live-clock="${activeTask.id}"]`);
      if (liveClock) liveClock.textContent = formatHMS(activeTask.worked_seconds);
    }
  }

  async function refreshActive() {
    try {
      const res = await fetch("/api/timer/active");
      const data = await res.json();
      if (data.active) {
        activeTask = {
          id: data.task.id,
          name: data.task.name,
          worked_seconds: data.task.worked_seconds,
          estimated_minutes: data.task.estimated_minutes,
        };
      } else {
        activeTask = null;
      }
      renderWidget();
    } catch (e) {
      // silencioso — não interrompe a navegação por causa disso
    }
  }

  window.getActiveTask = () => activeTask;
  window.refreshActiveTimer = refreshActive;

  refreshActive();
  setInterval(refreshActive, 8000);
  tickHandle = setInterval(tick, 1000);

  // ---------- Conflito de cronômetro ----------
  const conflictOverlay = document.getElementById("timerConflictOverlay");
  const conflictTaskName = document.getElementById("conflictTaskName");
  const conflictTaskTime = document.getElementById("conflictTaskTime");
  const conflictKeepBtn = document.getElementById("conflictKeepBtn");
  const conflictSwitchBtn = document.getElementById("conflictSwitchBtn");
  let pendingStartId = null;

  function openConflict(activeInfo, requestedId) {
    pendingStartId = requestedId;
    conflictTaskName.textContent = activeInfo.name;
    conflictTaskTime.textContent = formatHMS(activeInfo.worked_seconds);
    conflictOverlay.classList.add("is-open");
  }
  if (conflictKeepBtn) {
    conflictKeepBtn.addEventListener("click", () => {
      conflictOverlay.classList.remove("is-open");
      pendingStartId = null;
    });
  }
  if (conflictSwitchBtn) {
    conflictSwitchBtn.addEventListener("click", async () => {
      conflictOverlay.classList.remove("is-open");
      if (pendingStartId) await startTask(pendingStartId, true);
      pendingStartId = null;
    });
  }

  // ---------- Ações de cronômetro ----------
  async function startTask(taskId, force) {
    const res = await fetch(`/api/tasks/${taskId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: !!force }),
    });
    if (res.status === 409) {
      const data = await res.json();
      openConflict(data.active_task, taskId);
      return;
    }
    window.showToast && window.showToast("Cronômetro iniciado.");
    window.location.reload();
  }

  async function pauseTask(taskId) {
    await fetch(`/api/tasks/${taskId}/pause`, { method: "POST" });
    window.showToast && window.showToast("Tarefa pausada.");
    window.location.reload();
  }

  window.startTaskTimer = startTask;
  window.pauseTaskTimer = pauseTask;

  document.addEventListener("click", (e) => {
    const startBtn = e.target.closest("[data-timer-start]");
    if (startBtn) {
      e.preventDefault();
      e.stopPropagation();
      startTask(startBtn.getAttribute("data-timer-start"));
      return;
    }
    const pauseBtn = e.target.closest("[data-timer-pause]");
    if (pauseBtn) {
      e.preventDefault();
      e.stopPropagation();
      pauseTask(pauseBtn.getAttribute("data-timer-pause"));
      return;
    }
    const finishBtn = e.target.closest("[data-timer-finish]");
    if (finishBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = finishBtn.getAttribute("data-timer-finish");
      const name = finishBtn.getAttribute("data-task-name") || (activeTask && activeTask.id == id ? activeTask.name : "");
      const estimated = finishBtn.getAttribute("data-estimated-minutes");
      const worked = activeTask && activeTask.id == id
        ? activeTask.worked_seconds
        : parseInt(finishBtn.getAttribute("data-worked-seconds") || "0", 10);
      openCompletion(id, name, estimated ? parseInt(estimated, 10) : null, worked);
    }
  });

  if (widgetPause) widgetPause.addEventListener("click", () => activeTask && pauseTask(activeTask.id));
  if (widgetFinish) {
    widgetFinish.addEventListener("click", () => {
      if (!activeTask) return;
      openCompletion(activeTask.id, activeTask.name, activeTask.estimated_minutes, activeTask.worked_seconds);
    });
  }

  // ---------- Modal de conclusão ----------
  const completionOverlay = document.getElementById("completionOverlay");
  const completionTaskName = document.getElementById("completionTaskName");
  const completionCompare = document.getElementById("completionCompare");
  const completionClose = document.getElementById("completionClose");
  const completionDoneBtn = document.getElementById("completionDoneBtn");
  const moodPicker = document.getElementById("moodPicker");
  const delayReasonBlock = document.getElementById("delayReasonBlock");
  const delayReasonSelect = document.getElementById("delayReasonSelect");

  let completionState = { taskId: null, mood: null };

  function openCompletion(taskId, taskName, estimatedMinutes, workedSeconds) {
    completionState = { taskId, mood: null };
    completionTaskName.textContent = taskName || "Tarefa";
    moodPicker.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("is-active"));
    delayReasonBlock.style.display = "none";
    delayReasonSelect.value = "";

    const realMinutes = Math.round(workedSeconds / 60);
    if (estimatedMinutes) {
      const diff = realMinutes - estimatedMinutes;
      const percent = Math.round((diff / estimatedMinutes) * 1000) / 10;
      const sign = diff >= 0 ? "+" : "";
      completionCompare.innerHTML = `
        <div class="compare-row"><span>Tempo estimado</span><strong>${formatMinutesShort(estimatedMinutes)}</strong></div>
        <div class="compare-row"><span>Tempo realizado</span><strong>${formatMinutesShort(realMinutes)}</strong></div>
        <div class="compare-row"><span>Diferença</span><strong class="${diff > 0 ? 'text-danger' : 'text-primary'}">${sign}${formatMinutesShort(Math.abs(diff))} (${sign}${percent}%)</strong></div>
      `;
      if (diff > 0) delayReasonBlock.style.display = "block";
    } else {
      completionCompare.innerHTML = `<div class="compare-row"><span>Tempo realizado</span><strong>${formatMinutesShort(realMinutes)}</strong></div>`;
    }

    completionOverlay.classList.add("is-open");
  }
  window.openCompletionModal = openCompletion;

  if (moodPicker) {
    moodPicker.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        moodPicker.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        completionState.mood = btn.getAttribute("data-mood");
      });
    });
  }

  function closeCompletion() {
    completionOverlay.classList.remove("is-open");
  }
  if (completionClose) completionClose.addEventListener("click", closeCompletion);
  if (completionOverlay) {
    completionOverlay.addEventListener("click", (e) => {
      if (e.target === completionOverlay) closeCompletion();
    });
  }

  if (completionDoneBtn) {
    completionDoneBtn.addEventListener("click", async () => {
      if (!completionState.taskId) return;
      await fetch(`/api/tasks/${completionState.taskId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: completionState.mood,
          delay_reason: delayReasonSelect.value || null,
        }),
      });
      window.showToast && window.showToast("Tarefa concluída.");
      window.location.reload();
    });
  }
})();
