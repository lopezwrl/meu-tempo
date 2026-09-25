(function () {
  const dataEl = document.getElementById("chartsData");
  if (!dataEl || typeof Chart === "undefined") return;
  const data = JSON.parse(dataEl.textContent);

  function renderCharts() {
  const styles = getComputedStyle(document.documentElement);
  const cssVar = (name) => styles.getPropertyValue(name).trim();
  document.querySelectorAll("canvas").forEach((c) => { const old = Chart.getChart(c); if (old) old.destroy(); c.style.display = ""; });
  const COLORS = {
    primary: cssVar("--primary") || "#2F6F6B",
    accent: cssVar("--accent") || "#D98A3D",
    warning: cssVar("--warning") || "#E0A93D",
    danger: cssVar("--danger") || "#C1594F",
    inkSoft: cssVar("--ink-soft") || "#656F7A",
    border: cssVar("--border") || "#E7E2D8",
  };
  const PALETTE = [COLORS.primary, COLORS.accent, COLORS.warning, "#7CA67C", COLORS.danger, "#8A6FB3", "#3B6EA5"];

  Chart.defaults.color = COLORS.inkSoft;
  Chart.defaults.borderColor = COLORS.border;
  Chart.defaults.font.family = "Inter, sans-serif";

  const minutesToHours = (m) => Math.round((m / 60) * 10) / 10;

  // ---------- Horas por dia (últimos 30 dias) ----------
  const hpd = data.hours_per_day || [];
  const hpdCanvas = document.getElementById("chartHoursPerDay");
  if (hpdCanvas && hpd.length) {
    new Chart(hpdCanvas, {
      type: "bar",
      data: {
        labels: hpd.map((d) => d.date.slice(8, 10) + "/" + d.date.slice(5, 7)),
        datasets: [{
          label: "Horas trabalhadas",
          data: hpd.map((d) => minutesToHours(d.minutes)),
          backgroundColor: COLORS.primary,
          borderRadius: 4,
          maxBarThickness: 18,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
          y: { beginAtZero: true, title: { display: true, text: "horas" } },
        },
      },
    });
  }

  // ---------- Tempo por categoria (rosca) ----------
  const byCategory = data.by_category || [];
  const catCanvas = document.getElementById("chartHoursByCategory");
  if (catCanvas && byCategory.length) {
    new Chart(catCanvas, {
      type: "doughnut",
      data: {
        labels: byCategory.map((r) => r.label),
        datasets: [{
          data: byCategory.map((r) => minutesToHours(r.minutes)),
          backgroundColor: PALETTE,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, padding: 12 } } },
      },
    });
  }

  // ---------- Tempo por projeto (barra horizontal) ----------
  const byProject = data.by_project || [];
  const projCanvas = document.getElementById("chartHoursByProject");
  if (projCanvas && byProject.length) {
    new Chart(projCanvas, {
      type: "bar",
      data: {
        labels: byProject.map((r) => r.label),
        datasets: [{
          data: byProject.map((r) => minutesToHours(r.minutes)),
          backgroundColor: COLORS.accent,
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, title: { display: true, text: "horas" } }, y: { grid: { display: false } } },
      },
    });
  }

  // ---------- Estimado x real por categoria ----------
  const estVsReal = data.est_vs_real_category || [];
  const estCanvas = document.getElementById("chartEstVsReal");
  if (estCanvas && estVsReal.length) {
    new Chart(estCanvas, {
      type: "bar",
      data: {
        labels: estVsReal.map((r) => r.label),
        datasets: [
          { label: "Estimado", data: estVsReal.map((r) => minutesToHours(r.avg_estimated)), backgroundColor: COLORS.border, borderRadius: 4 },
          { label: "Real", data: estVsReal.map((r) => minutesToHours(r.avg_real)), backgroundColor: COLORS.primary, borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true, title: { display: true, text: "horas (média por tarefa)" } } },
      },
    });
  }

  // ---------- Tarefas concluídas x atrasadas por semana ----------
  const tpw = data.tasks_per_week || [];
  const tpwCanvas = document.getElementById("chartTasksPerWeek");
  if (tpwCanvas && tpw.length) {
    new Chart(tpwCanvas, {
      type: "bar",
      data: {
        labels: tpw.map((w) => w.label),
        datasets: [
          { label: "No prazo", data: tpw.map((w) => w.completed_on_time), backgroundColor: COLORS.primary, stack: "s" },
          { label: "Com atraso", data: tpw.map((w) => w.completed_late), backgroundColor: COLORS.danger, stack: "s" },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  // ---------- Tendência de precisão ----------
  const trend = (data.precision_trend || []).filter((p) => p.precision_percent !== null);
  const trendCanvas = document.getElementById("chartPrecisionTrend");
  if (trendCanvas && trend.length) {
    new Chart(trendCanvas, {
      type: "line",
      data: {
        labels: trend.map((p) => p.label),
        datasets: [{
          label: "Precisão (%)",
          data: trend.map((p) => p.precision_percent),
          borderColor: COLORS.primary,
          backgroundColor: COLORS.primary,
          tension: 0.3,
          pointRadius: 3,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: 100, title: { display: true, text: "%" } }, x: { grid: { display: false } } },
      },
    });
  } else if (trendCanvas) {
    trendCanvas.style.display = "none";
  }

  // ---------- Produtividade por horário ----------
  const prod = (data.productivity && data.productivity.hours_chart) || [];
  const prodCanvas = document.getElementById("chartProductivity");
  if (prodCanvas && prod.some((h) => h.minutes > 0)) {
    new Chart(prodCanvas, {
      type: "bar",
      data: {
        labels: prod.map((h) => `${h.hour}h`),
        datasets: [{
          data: prod.map((h) => minutesToHours(h.minutes)),
          backgroundColor: COLORS.accent,
          borderRadius: 3,
          maxBarThickness: 14,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } }, y: { beginAtZero: true, title: { display: true, text: "horas" } } },
      },
    });
  } else if (prodCanvas) {
    prodCanvas.style.display = "none";
  }
  }

  renderCharts();
  window.addEventListener("themechange", renderCharts);
})();
