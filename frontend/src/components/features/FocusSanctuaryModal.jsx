import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { soundscapeEngine, soundEffects } from '../../utils/audio';
import {
  CloudRain,
  Waves,
  Radio,
  Volume2,
  VolumeX,
  Wind,
  Play,
  Square,
  Bell,
  CheckCircle2,
} from 'lucide-react';

const SOUNDSCAPES = [
  {
    id: 'rain',
    name: 'Chuva Suave na Janela',
    subtitle: 'Modulação orgânica que mascara ruídos externos sem cansar a audição',
    icon: CloudRain,
  },
  {
    id: 'pink',
    name: 'Ruído Rosa Profundo (1/f)',
    subtitle: 'Frequência acústica equilibrada para leitura, escrita e programação',
    icon: Waves,
  },
  {
    id: 'zen',
    name: 'Harmônicos Serenos',
    subtitle: 'Acordes senoidais contínuos de baixa frequência para foco sem ansiedade',
    icon: Radio,
  },
];

const BREATH_PHASES = [
  { label: 'Inspire profundamente', instruction: 'Pelo nariz, expandindo o abdômen', scale: 1.38, freq: 432 },
  { label: 'Segure o ar', instruction: 'Mantenha a presença e a calma', scale: 1.38, freq: 528 },
  { label: 'Expire lentamente', instruction: 'Solte toda a tensão acumulada', scale: 0.85, freq: 396 },
  { label: 'Pausa serena', instruction: 'Pulmões em repouso absoluto', scale: 0.85, freq: 360 },
];

export function FocusSanctuaryModal({
  isOpen,
  onClose,
  initialTab = 'sound', // 'sound' | 'breath'
  onSoundStateChange,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [soundState, setSoundState] = useState(() => soundscapeEngine.getState());

  // Breathing state
  const [isBreathing, setIsBreathing] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [soundCueEnabled, setSoundCueEnabled] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSoundState(soundscapeEngine.getState());
    } else {
      setIsBreathing(false);
    }
  }, [isOpen, initialTab]);

  // Box Breathing 4-4-4-4 interval
  useEffect(() => {
    if (!isBreathing) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }
        // Advance phase
        setPhaseIndex((prevPhase) => {
          const nextPhase = (prevPhase + 1) % 4;
          if (nextPhase === 0) {
            setCyclesCompleted((c) => c + 1);
          }
          if (soundCueEnabled) {
            soundEffects.playBreathCue(BREATH_PHASES[nextPhase].freq);
          }
          return nextPhase;
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathing, soundCueEnabled]);

  const handleToggleSoundscape = (id) => {
    if (soundState.isPlaying && soundState.type === id) {
      soundscapeEngine.stop();
    } else {
      soundscapeEngine.start(id, soundState.volume);
    }
    const next = soundscapeEngine.getState();
    setSoundState(next);
    onSoundStateChange?.(next);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    soundscapeEngine.setVolume(val);
    const next = soundscapeEngine.getState();
    setSoundState(next);
    onSoundStateChange?.(next);
  };

  const handleStartBreathing = () => {
    if (!isBreathing) {
      setPhaseIndex(0);
      setSecondsLeft(4);
      setIsBreathing(true);
      if (soundCueEnabled) {
        soundEffects.playBreathCue(BREATH_PHASES[0].freq);
      }
    } else {
      setIsBreathing(false);
    }
  };

  const currentBreath = BREATH_PHASES[phaseIndex];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Santuário de Foco & Bem-Estar"
      description="Ambiente acústico sintetizado offline e regulação fisiológica anti-estresse"
    >
      <div className="space-y-5">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-surface-2 border border-primary-border/50">
          <button
            type="button"
            onClick={() => setActiveTab('sound')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sound'
                ? 'bg-surface text-primary shadow-sm border border-primary/20'
                : 'text-text-3 hover:text-text'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Paisagens Sonoras</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('breath')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'breath'
                ? 'bg-surface text-primary shadow-sm border border-primary/20'
                : 'text-text-3 hover:text-text'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>Respiração 4-4-4-4</span>
          </button>
        </div>

        {activeTab === 'sound' ? (
          <div className="space-y-4">
            {/* Soundscape Cards */}
            <div className="space-y-2.5">
              {SOUNDSCAPES.map((item) => {
                const Icon = item.icon;
                const isSelected = soundState.isPlaying && soundState.type === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleSoundscape(item.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-primary-soft border-primary shadow-sm shadow-[#D63B6A]/10'
                        : 'bg-surface border-primary-border/60 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary text-white shadow-md shadow-[#D63B6A]/25'
                            : 'bg-surface-2 text-primary'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-text truncate">{item.name}</h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-3 mt-0.5 leading-snug">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Animated SVG Equalizer when active */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="flex items-end gap-0.5 h-5 px-2">
                          {[0.6, 1, 0.75, 0.9].map((h, i) => (
                            <motion.span
                              key={i}
                              animate={{ height: ['6px', `${h * 18}px`, '6px'] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.9 + i * 0.15,
                                ease: 'easeInOut',
                              }}
                              className="w-1 rounded-full bg-primary inline-block"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-surface-2 text-text-3 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume & Zen Chime Controls */}
            <div className="p-3.5 rounded-2xl bg-surface-2/70 border border-primary-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                {soundState.isPlaying ? (
                  <Volume2 className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <VolumeX className="w-4 h-4 text-text-3 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-semibold text-text-2 mb-1">
                    <span>Intensidade acústica</span>
                    <span>{Math.round(soundState.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={soundState.volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-[#D63B6A] cursor-pointer h-1.5 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => soundEffects.playTimerBell()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-primary-border/60 text-xs font-semibold text-text-2 hover:text-primary hover:border-primary transition-colors"
                  title="Tocar sino de atenção plena"
                >
                  <Bell className="w-3.5 h-3.5 text-primary" />
                  <span>Sino Zen</span>
                </button>

                {soundState.isPlaying && (
                  <button
                    type="button"
                    onClick={() => {
                      soundscapeEngine.stop();
                      const next = soundscapeEngine.getState();
                      setSoundState(next);
                      onSoundStateChange?.(next);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 transition-colors"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Silenciar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Box Breathing 4-4-4-4 Interactive SVG Guide */
          <div className="flex flex-col items-center py-2 space-y-5">
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Outer Concentric SVG Aura */}
              <motion.div
                animate={{
                  scale: isBreathing ? currentBreath.scale : 1,
                  opacity: isBreathing ? [0.35, 0.65, 0.35] : 0.25,
                }}
                transition={{ duration: 3.8, ease: 'easeInOut' }}
                className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-[#D63B6A]/30 via-[#F9C6D0]/50 to-[#F0A0B5]/30 blur-xl pointer-events-none"
              />

              {/* Geometric SVG Breathing Mandala */}
              <motion.svg
                viewBox="0 0 200 200"
                className="w-44 h-44 overflow-visible"
                animate={{
                  scale: isBreathing ? currentBreath.scale : 1,
                  rotate: isBreathing ? phaseIndex * 45 : 0,
                }}
                transition={{ duration: 3.8, ease: 'easeInOut' }}
              >
                <circle
                  cx="100"
                  cy="100"
                  r="68"
                  fill="none"
                  stroke="#F9C6D0"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  opacity="0.7"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="54"
                  fill="rgba(214, 59, 106, 0.10)"
                  stroke="#D63B6A"
                  strokeWidth="2.5"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="38"
                  fill="rgba(249, 198, 208, 0.28)"
                  stroke="#F0A0B5"
                  strokeWidth="1.5"
                />
              </motion.svg>

              {/* Center Countdown & Phase Label */}
              <div className="relative z-10 flex flex-col items-center text-center pointer-events-none">
                <span className="text-3xl font-extrabold font-mono text-primary">
                  {isBreathing ? `${secondsLeft}s` : '4-4-4-4'}
                </span>
                <span className="text-[11px] font-bold text-text mt-1 uppercase tracking-wider">
                  {isBreathing ? currentBreath.label : 'Box Breathing'}
                </span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-text-2">
                {isBreathing
                  ? currentBreath.instruction
                  : 'Técnica de 4 tempos usada para reduzir o cortisol e restaurar a clareza mental.'}
              </p>
              {cyclesCompleted > 0 && (
                <p className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{cyclesCompleted} ciclo(s) completo(s) nesta pausa</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 w-full justify-center pt-1">
              <button
                type="button"
                onClick={handleStartBreathing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-md shadow-[#D63B6A]/25 hover:bg-primary-light transition-all"
              >
                {isBreathing ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Pausar exercício</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar Respiração Guiada</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSoundCueEnabled(!soundCueEnabled)}
                className={`p-2.5 rounded-2xl border text-xs font-semibold transition-colors ${
                  soundCueEnabled
                    ? 'bg-primary-soft border-primary/30 text-primary'
                    : 'bg-surface border-primary-border/50 text-text-3'
                }`}
                title="Guia sonoro suave a cada 4 segundos"
              >
                {soundCueEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
