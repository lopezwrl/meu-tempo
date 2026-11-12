import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from '../services/api';
import { useThemeStore } from '../stores/themeStore';
import { AchievementBadge } from '../components/features/AchievementBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Award,
  TrendingUp,
} from 'lucide-react';

export function History() {
  const actualTheme = useThemeStore((s) => s.actualTheme);

  // Dynamic theme colors for charts matching new favicon palette (#D63B6A & #F9C6D0)
  const isDark = actualTheme === 'dark';
  const primaryColor = isDark ? '#F07297' : '#D63B6A';
  const secondaryColor = isDark ? '#F0A0B5' : '#E85280';
  const textColor = isDark ? '#F9C6D0' : '#732642';
  const borderColor = isDark ? 'rgba(249,198,208,0.2)' : 'rgba(214,59,106,0.2)';
  const surfaceColor = isDark ? '#240D17' : '#FFFFFF';

  // Queries
  const { data: weekSummary } = useQuery({
    queryKey: queryKeys.weekSummary(),
    queryFn: () => api.getWeekSummary(),
  });

  const { data: hoursPerDay } = useQuery({
    queryKey: queryKeys.hoursPerDay(30),
    queryFn: () => api.getHoursPerDay(30),
  });

  const { data: tasksPerWeek } = useQuery({
    queryKey: queryKeys.tasksPerWeek(8),
    queryFn: () => api.getTasksPerWeek(8),
  });

  const { data: estimatedVsReal } = useQuery({
    queryKey: queryKeys.estimatedVsReal,
    queryFn: api.getEstimatedVsReal,
  });

  const { data: productivityByHour } = useQuery({
    queryKey: queryKeys.productivityByHour,
    queryFn: api.getProductivityByHour,
  });

  const { data: achievements } = useQuery({
    queryKey: queryKeys.achievements,
    queryFn: api.getAchievements,
  });

  const handlePrint = () => {
    window.print();
  };

  // Safe data transformers
  const rawHours = Array.isArray(hoursPerDay) ? hoursPerDay : [];
  const hoursData = rawHours.map((d) => {
    const rawVal = d.hours !== undefined ? d.hours : (d.minutes ? d.minutes / 60 : 0);
    return {
      dia: d.day_label || (d.date ? d.date.slice(5) : ''),
      horas: Number(Number(rawVal).toFixed(1)),
    };
  });

  const rawWeeks = Array.isArray(tasksPerWeek) ? tasksPerWeek : [];
  const tasksWeekData = rawWeeks.map((w) => ({
    semana: w.label || w.week || '',
    concluidas: (w.completed_on_time ?? 0) + (w.completed_late ?? 0) || w.count || w.completed || 0,
  }));

  const rawCats = Array.isArray(estimatedVsReal?.by_category)
    ? estimatedVsReal.by_category
    : Array.isArray(estimatedVsReal)
    ? estimatedVsReal
    : [];
  const estVsRealCategory = rawCats.map((c) => ({
    nome: c.label || c.category_name || c.name || 'Geral',
    estimado: Number(((c.avg_estimated ?? c.estimated_minutes ?? 0) / 60).toFixed(1)),
    real: Number(((c.avg_real ?? c.real_minutes ?? 0) / 60).toFixed(1)),
  }));

  const rawHoursList = Array.isArray(productivityByHour)
    ? productivityByHour
    : Array.isArray(productivityByHour?.hours_chart)
    ? productivityByHour.hours_chart
    : [];
  const prodHourData = rawHoursList.map((h) => ({
    hora: `${h.hour}h`,
    minutos: Math.round(h.minutes ?? h.worked_minutes ?? 0),
  }));

  const safeAchievements = Array.isArray(achievements)
    ? achievements
    : Array.isArray(achievements?.achieved)
    ? [
        ...achievements.achieved.map((a, i) => ({
          id: a.key ? `ach-${a.key}` : `ach-${i}`,
          key: a.key,
          title: a.title,
          description: a.next_target
            ? `Progresso: ${a.progress} • Próximo marco: ${a.next_target}`
            : 'Marco desbloqueado com consistência',
          unlocked: true,
        })),
        ...(achievements.next_up || []).map((n, i) => ({
          id: n.key ? `next-${n.key}` : `next-${i}`,
          key: n.key,
          title: n.label,
          description: `Em progresso: ${n.progress} de ${n.target}`,
          unlocked: false,
        })),
      ]
    : [];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
            Histórico & Relatórios
          </h1>
          <p className="text-xs text-text-3 mt-0.5">
            Análises profundas de tempo, produtividade e conquistas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-primary-border/60 text-xs font-semibold text-text-2 hover:text-primary transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          <a
            href="/api/export/report.xlsx"
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-md shadow-pink-500/20 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Relatório Excel (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Resumo Executivo da Semana em Card Destacado */}
      <section className="p-6 rounded-3xl bg-gradient-to-tr from-pink-500/10 via-surface to-rose-400/5 border border-primary-border shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-pink-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text">Resumo Executivo da Semana</h2>
            <p className="text-xs text-text-3">Visão consolidada do seu ritmo de trabalho</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="p-3.5 rounded-2xl bg-surface/80 border border-primary-border/40">
            <span className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">
              Horas registradas
            </span>
            <p className="text-xl font-extrabold text-primary mt-1">
              {weekSummary?.worked_minutes !== undefined
                ? `${(weekSummary.worked_minutes / 60).toFixed(1)}h`
                : weekSummary?.worked_hours
                ? `${weekSummary.worked_hours}h`
                : '0h'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface/80 border border-primary-border/40">
            <span className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">
              Tarefas concluídas
            </span>
            <p className="text-xl font-extrabold text-text mt-1">
              {weekSummary?.completed ?? weekSummary?.completed_tasks ?? 0}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface/80 border border-primary-border/40">
            <span className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">
              Precisão média
            </span>
            <p className="text-xl font-extrabold text-text mt-1">
              {weekSummary?.precision_percent != null
                ? `${weekSummary.precision_percent}%`
                : weekSummary?.precision_rate
                ? `${weekSummary.precision_rate}%`
                : '—'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface/80 border border-primary-border/40">
            <span className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">
              Destaque
            </span>
            <p className="text-sm font-bold text-text mt-2 truncate">
              {weekSummary?.top_category
                ? weekSummary.top_category
                : weekSummary?.top_project
                ? weekSummary.top_project
                : `${weekSummary?.created ?? 0} criadas`}
            </p>
          </div>
        </div>

        {productivityByHour?.peak_message && (
          <p className="text-xs text-text-2 mt-4 p-3 rounded-xl bg-primary-soft/60 border border-primary/20 leading-relaxed">
            {productivityByHour.peak_message}
          </p>
        )}
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Hours per Day (30 days) */}
        <div className="p-5 rounded-3xl bg-surface border border-primary-border/60 shadow-sm backdrop-blur-sm">
          <h3 className="text-sm font-bold text-text mb-1">Horas por dia (Últimos 30 dias)</h3>
          <p className="text-xs text-text-3 mb-4">Volume diário de tempo em foco</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="dia" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: surfaceColor,
                    borderColor,
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: textColor,
                  }}
                  formatter={(val) => [`${val} h`, 'Horas']}
                />
                <Bar dataKey="horas" fill={primaryColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tasks completed per week (8 weeks) */}
        <div className="p-5 rounded-3xl bg-surface border border-primary-border/60 shadow-sm backdrop-blur-sm">
          <h3 className="text-sm font-bold text-text mb-1">Tarefas concluídas por semana</h3>
          <p className="text-xs text-text-3 mb-4">Evolução do ritmo de entregas</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="semana" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: surfaceColor,
                    borderColor,
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: textColor,
                  }}
                  formatter={(val) => [`${val} tarefas`, 'Concluídas']}
                />
                <Bar dataKey="concluidas" fill={secondaryColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Estimated vs Real by Category */}
        <div className="p-5 rounded-3xl bg-surface border border-primary-border/60 shadow-sm backdrop-blur-sm">
          <h3 className="text-sm font-bold text-text mb-1">Tempo Estimado vs Real por Categoria</h3>
          <p className="text-xs text-text-3 mb-4">Comparação média em horas</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estVsRealCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="nome" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: surfaceColor,
                    borderColor,
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: textColor,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="estimado" name="Estimado (h)" fill={isDark ? '#8a5570' : '#F9C6D0'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="real" name="Real (h)" fill={primaryColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Productivity by Hour of Day */}
        <div className="p-5 rounded-3xl bg-surface border border-primary-border/60 shadow-sm backdrop-blur-sm">
          <h3 className="text-sm font-bold text-text mb-1">Produtividade por Horário do Dia</h3>
          <p className="text-xs text-text-3 mb-4">Momentos com maior volume de foco</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prodHourData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="hora" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: surfaceColor,
                    borderColor,
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: textColor,
                  }}
                  formatter={(val) => [`${val} min`, 'Tempo']}
                />
                <Line
                  type="monotone"
                  dataKey="minutos"
                  stroke={primaryColor}
                  strokeWidth={2.5}
                  dot={{ fill: primaryColor, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Conquistas (Achievements Section) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span>Conquistas & Marcos</span>
            </h2>
            <p className="text-xs text-text-3">Recompensas pelo seu progresso e consistência</p>
          </div>
          <span className="text-xs font-semibold text-primary px-2.5 py-1 rounded-full bg-primary-soft">
            {safeAchievements.filter((a) => a.unlocked).length} de{' '}
            {safeAchievements.length} desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {safeAchievements.map((ach, idx) => (
            <AchievementBadge key={ach.id || idx} achievement={ach} index={idx} />
          ))}
        </div>
      </section>

      {/* Raw Exports Download Cards */}
      <section className="p-5 rounded-3xl bg-surface border border-primary-border/60 shadow-sm">
        <h3 className="text-sm font-bold text-text mb-1">Exportar dados brutos</h3>
        <p className="text-xs text-text-3 mb-4">Baixe seus registros para backup ou análise em planilhas</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/api/export/tasks.csv"
            download
            className="flex items-center gap-2 p-3 rounded-2xl bg-surface-2 hover:bg-primary-soft text-text-2 hover:text-primary transition-colors text-xs font-semibold border border-primary-border/40"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Tarefas (.csv)</span>
          </a>

          <a
            href="/api/export/sessions.csv"
            download
            className="flex items-center gap-2 p-3 rounded-2xl bg-surface-2 hover:bg-primary-soft text-text-2 hover:text-primary transition-colors text-xs font-semibold border border-primary-border/40"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Sessões de cronômetro (.csv)</span>
          </a>

          <a
            href="/api/export?notebook=all"
            download
            className="flex items-center gap-2 p-3 rounded-2xl bg-surface-2 hover:bg-primary-soft text-text-2 hover:text-primary transition-colors text-xs font-semibold border border-primary-border/40"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Notas em Markdown (.zip)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
