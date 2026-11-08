import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../services/api';
import { useThemeStore } from '../stores/themeStore';
import { useUserStore } from '../stores/userStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import {
  Sun,
  Moon,
  Laptop,
  Clock,
  Calendar,
  Shield,
  Download,
  Upload,
  Trash2,
  Plus,
  Check,
  User,
  Sparkles,
} from 'lucide-react';

const WEEKDAYS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export function Settings() {
  const queryClient = useQueryClient();
  const { theme, setTheme, actualTheme } = useThemeStore();
  const { user, setUser } = useUserStore();
  const { addToast } = useToast();

  const [nameInput, setNameInput] = useState(user.name || '');
  const [idleMinutesInput, setIdleMinutesInput] = useState(user.idle_minutes || 10);
  const [restoring, setRestoring] = useState(false);

  // New commitment form state
  const [commitmentName, setCommitmentName] = useState('');
  const [commitmentRecurring, setCommitmentRecurring] = useState(true);
  const [commitmentWeekday, setCommitmentWeekday] = useState('0');
  const [commitmentDate, setCommitmentDate] = useState('');
  const [commitmentStart, setCommitmentStart] = useState('09:00');
  const [commitmentEnd, setCommitmentEnd] = useState('10:00');

  // Queries
  const { data: scheduleData } = useQuery({
    queryKey: queryKeys.schedule,
    queryFn: api.getSchedule,
  });

  const { data: commitmentsData } = useQuery({
    queryKey: queryKeys.commitments,
    queryFn: api.getCommitments,
  });

  const [localSchedule, setLocalSchedule] = useState([]);

  React.useEffect(() => {
    if (scheduleData) {
      setLocalSchedule(scheduleData);
    }
  }, [scheduleData]);

  // Mutations
  const updateScheduleMutation = useMutation({
    mutationFn: api.updateSchedule,
    onSuccess: (data) => {
      setLocalSchedule(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule });
      addToast({ title: 'Jornada atualizada', message: 'Configurações de horário salvas com sucesso!', type: 'success' });
    },
  });

  const createCommitmentMutation = useMutation({
    mutationFn: api.createCommitment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments });
      setCommitmentName('');
      addToast({ title: 'Compromisso adicionado', message: 'Seu novo compromisso foi registrado.', type: 'success' });
    },
  });

  const deleteCommitmentMutation = useMutation({
    mutationFn: api.deleteCommitment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: api.updateUser,
    onSuccess: (data) => {
      setUser(data);
      addToast({ title: 'Perfil atualizado', message: 'Seu nome foi alterado com sucesso!', type: 'success' });
    },
  });

  const handleScheduleChange = (index, field, value) => {
    setLocalSchedule((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveSchedule = () => {
    updateScheduleMutation.mutate(localSchedule);
  };

  const handleAddCommitment = (e) => {
    e.preventDefault();
    if (!commitmentName.trim()) return;
    createCommitmentMutation.mutate({
      name: commitmentName.trim(),
      recurring: commitmentRecurring,
      weekday: commitmentRecurring ? parseInt(commitmentWeekday, 10) : null,
      specific_date: !commitmentRecurring ? commitmentDate : null,
      start_time: commitmentStart,
      end_time: commitmentEnd,
    });
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    updateUserMutation.mutate({
      name: nameInput.trim(),
      idle_minutes: parseInt(idleMinutesInput, 10) || 10,
    });
  };

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Atenção: A restauração substituirá todos os dados atuais. Continuar?')) {
      return;
    }

    setRestoring(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await api.restoreBackup(payload);
      addToast({ title: 'Backup restaurado', message: 'Dados restaurados com sucesso!', type: 'success' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      alert(`Erro ao restaurar: ${err.message || 'Arquivo inválido'}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
          Configurações
        </h1>
        <p className="text-xs text-text-3 mt-0.5">
          Personalize sua jornada, compromissos e preferências do sistema
        </p>
      </div>

      {/* Tema */}
      <section className="p-6 rounded-3xl bg-surface border border-primary-border/60 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text">Aparência & Tema</h2>
          <p className="text-xs text-text-3">Escolha como o app é exibido para você</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
              theme === 'light'
                ? 'bg-primary-soft border-primary text-primary shadow-sm shadow-pink-500/10'
                : 'bg-surface-2 border-primary-border/40 text-text-2 hover:border-primary/40'
            }`}
          >
            <Sun className="w-5 h-5 text-pink-500" />
            <div className="text-left">
              <p>Modo Claro</p>
              <span className="text-[10px] text-text-3 font-normal">Fundo rosa bebê suave</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
              theme === 'dark'
                ? 'bg-primary-soft border-primary text-primary shadow-sm shadow-pink-500/10'
                : 'bg-surface-2 border-primary-border/40 text-text-2 hover:border-primary/40'
            }`}
          >
            <Moon className="w-5 h-5 text-pink-400" />
            <div className="text-left">
              <p>Modo Escuro</p>
              <span className="text-[10px] text-text-3 font-normal">Vinho escuro elegante</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('auto')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
              theme === 'auto'
                ? 'bg-primary-soft border-primary text-primary shadow-sm shadow-pink-500/10'
                : 'bg-surface-2 border-primary-border/40 text-text-2 hover:border-primary/40'
            }`}
          >
            <Laptop className="w-5 h-5 text-purple-500" />
            <div className="text-left">
              <p>Seguir Sistema</p>
              <span className="text-[10px] text-text-3 font-normal">Adapta-se ao seu SO</span>
            </div>
          </button>
        </div>

        <div className="pt-3 border-t border-primary-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-text">Animação de Entrada</h3>
            <p className="text-[11px] text-text-3">Ícone do Meu Tempo com rotação de ponteiros e morphing de texto</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.dispatchEvent(new CustomEvent('mt-replay-splash'))}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-primary" />
            <span>Ver animação de abertura</span>
          </Button>
        </div>
      </section>

      {/* Perfil & Inatividade */}
      <section className="p-6 rounded-3xl bg-surface border border-primary-border/60 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text">Perfil & Cronômetro</h2>
          <p className="text-xs text-text-3">Seu nome e controle de inatividade</p>
        </div>

        <form onSubmit={handleSaveUser} className="space-y-4 max-w-md">
          <Input
            label="Seu nome ou apelido"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ex.: Alice"
            icon={<User className="w-4 h-4" />}
          />

          <Input
            label="Alerta de inatividade do cronômetro (minutos)"
            type="number"
            min="0"
            max="240"
            value={idleMinutesInput}
            onChange={(e) => setIdleMinutesInput(e.target.value)}
            helper="Quando você fica sem mexer com o cronômetro rodando (0 desliga o aviso)."
            icon={<Clock className="w-4 h-4" />}
          />

          <Button type="submit" loading={updateUserMutation.isPending} size="sm">
            Salvar perfil
          </Button>
        </form>
      </section>

      {/* Jornada de Trabalho Semanal */}
      <section className="p-6 rounded-3xl bg-surface border border-primary-border/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text">Jornada de Trabalho</h2>
            <p className="text-xs text-text-3">Define sua capacidade diária e timeline</p>
          </div>
          <Button
            size="sm"
            onClick={handleSaveSchedule}
            loading={updateScheduleMutation.isPending}
          >
            Salvar jornada
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-primary-border/40 text-text-3 font-semibold">
                <th className="py-2.5 px-3">Dia</th>
                <th className="py-2.5 px-3">Trabalha?</th>
                <th className="py-2.5 px-3">Início</th>
                <th className="py-2.5 px-3">Fim</th>
                <th className="py-2.5 px-3">Almoço início</th>
                <th className="py-2.5 px-3">Almoço fim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-border/20">
              {localSchedule.map((row, index) => (
                <tr key={row.weekday} className="hover:bg-surface-2/40">
                  <td className="py-2 px-3 font-semibold text-text">
                    {WEEKDAYS[row.weekday] || `Dia ${row.weekday}`}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="checkbox"
                      checked={row.is_working_day}
                      onChange={(e) =>
                        handleScheduleChange(index, 'is_working_day', e.target.checked)
                      }
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="time"
                      value={row.start_time || '08:00'}
                      onChange={(e) =>
                        handleScheduleChange(index, 'start_time', e.target.value)
                      }
                      disabled={!row.is_working_day}
                      className="bg-surface-2 border border-primary-border/40 rounded-lg px-2 py-1 text-text disabled:opacity-40"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="time"
                      value={row.end_time || '18:00'}
                      onChange={(e) =>
                        handleScheduleChange(index, 'end_time', e.target.value)
                      }
                      disabled={!row.is_working_day}
                      className="bg-surface-2 border border-primary-border/40 rounded-lg px-2 py-1 text-text disabled:opacity-40"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="time"
                      value={row.lunch_start || ''}
                      onChange={(e) =>
                        handleScheduleChange(index, 'lunch_start', e.target.value)
                      }
                      disabled={!row.is_working_day}
                      className="bg-surface-2 border border-primary-border/40 rounded-lg px-2 py-1 text-text disabled:opacity-40"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="time"
                      value={row.lunch_end || ''}
                      onChange={(e) =>
                        handleScheduleChange(index, 'lunch_end', e.target.value)
                      }
                      disabled={!row.is_working_day}
                      className="bg-surface-2 border border-primary-border/40 rounded-lg px-2 py-1 text-text disabled:opacity-40"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Compromissos Fixos */}
      <section className="p-6 rounded-3xl bg-surface border border-primary-border/60 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text">Compromissos Fixos</h2>
          <p className="text-xs text-text-3">Reuniões recorrentes ou eventos bloqueados na agenda</p>
        </div>

        {/* List of commitments */}
        <div className="space-y-2">
          {(commitmentsData || []).length === 0 ? (
            <p className="text-xs text-text-3 italic">Nenhum compromisso fixo cadastrado.</p>
          ) : (
            commitmentsData.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-surface-2 border border-primary-border/40"
              >
                <div>
                  <h4 className="text-xs font-bold text-text">{c.name}</h4>
                  <p className="text-[11px] text-text-3 mt-0.5">
                    {c.recurring
                      ? `Toda ${WEEKDAYS[c.weekday] || ''}`
                      : c.specific_date}{' '}
                    • {c.start_time} até {c.end_time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteCommitmentMutation.mutate(c.id)}
                  className="p-1.5 rounded-lg text-text-3 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add commitment form */}
        <form onSubmit={handleAddCommitment} className="p-4 rounded-2xl bg-surface-2/40 border border-primary-border/40 space-y-3">
          <h4 className="text-xs font-bold text-text">Adicionar novo compromisso</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Ex.: Reunião de equipe"
              value={commitmentName}
              onChange={(e) => setCommitmentName(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <select
                value={commitmentRecurring ? '1' : '0'}
                onChange={(e) => setCommitmentRecurring(e.target.value === '1')}
                className="rounded-xl bg-surface border border-primary-border/70 px-3 py-1.5 text-xs text-text focus:outline-none"
              >
                <option value="1">Recorrente (semanal)</option>
                <option value="0">Data específica</option>
              </select>

              {commitmentRecurring ? (
                <select
                  value={commitmentWeekday}
                  onChange={(e) => setCommitmentWeekday(e.target.value)}
                  className="flex-1 rounded-xl bg-surface border border-primary-border/70 px-3 py-1.5 text-xs text-text focus:outline-none"
                >
                  {WEEKDAYS.map((day, idx) => (
                    <option key={day} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  value={commitmentDate}
                  onChange={(e) => setCommitmentDate(e.target.value)}
                  required
                  className="flex-1 rounded-xl bg-surface border border-primary-border/70 px-3 py-1.5 text-xs text-text focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Início"
              type="time"
              value={commitmentStart}
              onChange={(e) => setCommitmentStart(e.target.value)}
              required
            />
            <Input
              label="Fim"
              type="time"
              value={commitmentEnd}
              onChange={(e) => setCommitmentEnd(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={createCommitmentMutation.isPending}>
              Adicionar compromisso
            </Button>
          </div>
        </form>
      </section>

      {/* Backup e Restauração */}
      <section className="p-6 rounded-3xl bg-surface border border-primary-border/60 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Dados e Backup</span>
          </h2>
          <p className="text-xs text-text-3">
            Seus dados ficam salvos localmente. Mantenha cópias de segurança em segurança.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-surface-2 border border-primary-border/40 space-y-2">
            <h4 className="text-xs font-bold text-text">Baixar backup completo</h4>
            <p className="text-[11px] text-text-3">
              Exporta todas as suas tarefas, notas, cadernos, projetos e sessões em formato JSON.
            </p>
            <a
              href="/api/backup"
              download
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-sm shadow-pink-500/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar arquivo .json</span>
            </a>
          </div>

          <div className="p-4 rounded-2xl bg-surface-2 border border-primary-border/40 space-y-2">
            <h4 className="text-xs font-bold text-text">Restaurar backup</h4>
            <p className="text-[11px] text-text-3">
              Substitui os dados atuais pelos do arquivo. Uma cópia de segurança é criada antes.
            </p>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-primary-border text-text-2 hover:text-primary hover:border-primary text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{restoring ? 'Restaurando...' : 'Escolher arquivo .json'}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFile}
                disabled={restoring}
                hidden
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

