import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useUserStore } from '../../stores/userStore';
import { api } from '../../services/api';
import { soundEffects } from '../../utils/audio';
import {
  Sparkles,
  User,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function OnboardingModal({ isOpen, onClose }) {
  const { user, setUser } = useUserStore();
  const [name, setName] = useState(user?.name && user.name !== 'Você' ? user.name : '');
  const [workdayStart, setWorkdayStart] = useState(user?.workday_start || '08:00');
  const [workdayEnd, setWorkdayEnd] = useState(user?.workday_end || '18:00');
  const [notebook, setNotebook] = useState('Geral');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async (skip = false) => {
    setIsSubmitting(true);
    try {
      const chosenName = skip ? (user?.name || 'Você') : (name.trim() || 'Você');
      await api.completeOnboarding({
        name: chosenName,
        workday_start: workdayStart,
        workday_end: workdayEnd,
        notebook: notebook.trim() || 'Geral',
        skip,
      });

      setUser({
        ...user,
        name: chosenName,
        workday_start: workdayStart,
        workday_end: workdayEnd,
        onboarded: true,
      });

      soundEffects.playWarmChord();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#D63B6A', '#F9C6D0', '#F0A0B5', '#FFFFFF'],
        ticks: 60,
      });

      onClose();
    } catch {
      // Even if network fails, update local state so user can proceed smoothly
      setUser({
        ...user,
        name: name.trim() || 'Você',
        onboarded: true,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative z-10 w-full max-w-lg bg-surface border border-primary-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Ambient Corner Aura */}
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-tr from-[#D63B6A]/30 to-[#F9C6D0]/40 blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-[#D63B6A]/25 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                Primeiro Acesso
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
                Boas-vindas ao Meu Tempo
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-3 mb-6 leading-relaxed">
            Seu novo refúgio para foco, organização de rotina e clareza mental. Como podemos te chamar para personalizar sua experiência?
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFinish(false);
            }}
            className="space-y-4"
          >
            {/* Campo 1: Nome */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-2">
                Seu nome ou apelido
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-primary absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Alice, Carlos, Loren..."
                  required
                  autoFocus
                  maxLength={60}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-2 border border-primary-border/60 text-sm font-semibold text-text placeholder:text-text-3/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {name.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 text-xs text-primary font-semibold pt-0.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Olá, {name.trim()}! Seu dia será planejado com leveza.</span>
                </motion.div>
              )}
            </div>

            {/* Campo 2: Jornada de Trabalho (Início e Fim) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-text-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Horário aproximado do seu dia de trabalho</span>
              </label>
              <p className="text-[11px] text-text-3">
                Usado pelo Medidor Anti-Burnout e Ritmo Circadiano para proteger seu tempo.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-text-3 font-semibold uppercase">Início</span>
                  <input
                    type="time"
                    value={workdayStart}
                    onChange={(e) => setWorkdayStart(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-2 border border-primary-border/50 text-xs font-semibold text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-text-3 font-semibold uppercase">Término</span>
                  <input
                    type="time"
                    value={workdayEnd}
                    onChange={(e) => setWorkdayEnd(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-2 border border-primary-border/50 text-xs font-semibold text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Campo 3: Primeiro Caderno */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-text-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>Nome do seu primeiro caderno de notas</span>
              </label>
              <input
                type="text"
                value={notebook}
                onChange={(e) => setNotebook(e.target.value)}
                placeholder="Ex.: Geral, Ideias, Estudos..."
                maxLength={40}
                className="w-full px-4 py-2 rounded-xl bg-surface-2 border border-primary-border/50 text-xs font-semibold text-text placeholder:text-text-3/60 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-primary-border/40">
              <button
                type="button"
                onClick={() => handleFinish(true)}
                disabled={isSubmitting}
                className="text-xs font-semibold text-text-3 hover:text-text transition-colors px-2 py-1"
              >
                Configurar depois
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-lg shadow-[#D63B6A]/25 hover:bg-primary-light active:scale-95 transition-all"
              >
                <span>{isSubmitting ? 'Salvando...' : 'Começar a usar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
