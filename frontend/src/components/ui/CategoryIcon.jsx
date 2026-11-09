import React from 'react';
import {
  Briefcase,
  Code2,
  BookOpen,
  Home,
  PhoneCall,
  HeartPulse,
  Wallet,
  Sparkles,
  Tag,
  CheckCircle2,
  Clock,
  Flame,
  ShieldCheck,
  Trophy,
  Zap,
  Activity,
  Feather,
  Folder,
} from 'lucide-react';

const CATEGORY_ICON_MAP = {
  briefcase: Briefcase,
  trabalho: Briefcase,
  work: Briefcase,
  code: Code2,
  desenvolvimento: Code2,
  dev: Code2,
  book: BookOpen,
  estudos: BookOpen,
  study: BookOpen,
  home: Home,
  pessoal: Home,
  casa: Home,
  phone: PhoneCall,
  reunioes: PhoneCall,
  reuniões: PhoneCall,
  saude: HeartPulse,
  saúde: HeartPulse,
  financas: Wallet,
  finanças: Wallet,
  folder: Folder,
  sparkles: Sparkles,
};

/**
 * Renders a crisp professional SVG icon for any category,
 * never displaying raw emoji characters or raw icon strings.
 */
export function CategoryIcon({ icon, name, className = 'w-3.5 h-3.5' }) {
  const keyFromIcon = (icon || '').toString().toLowerCase().trim();
  const keyFromName = (name || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const IconComponent =
    CATEGORY_ICON_MAP[keyFromIcon] ||
    CATEGORY_ICON_MAP[keyFromName] ||
    Tag;

  return <IconComponent className={className} />;
}

const ACHIEVEMENT_ICON_MAP = {
  tasks: CheckCircle2,
  hours: Clock,
  streak: Flame,
  clean_week: ShieldCheck,
};

/**
 * Renders a crisp professional SVG icon for achievements.
 */
export function AchievementIcon({ achievementKey, className = 'w-5 h-5' }) {
  const IconComponent = ACHIEVEMENT_ICON_MAP[achievementKey] || Trophy;
  return <IconComponent className={className} />;
}

export const ENERGY_LEVELS = [
  {
    id: 'alta',
    label: 'Foco Profundo',
    shortLabel: 'Energia Alta',
    description: 'Exige máxima concentração e criatividade',
    icon: Zap,
    badgeClass:
      'bg-rose-500/10 text-[#D63B6A] border-[#D63B6A]/30 dark:bg-rose-500/15 dark:text-[#F9C6D0]',
  },
  {
    id: 'media',
    label: 'Fluxo Normal',
    shortLabel: 'Energia Média',
    description: 'Execução constante e colaborativa',
    icon: Activity,
    badgeClass:
      'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    id: 'baixa',
    label: 'Modo Leve',
    shortLabel: 'Energia Leve',
    description: 'Tarefas mecânicas, organização e revisão rápida',
    icon: Feather,
    badgeClass:
      'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
];

export function EnergyBadge({ level = 'media', size = 'sm' }) {
  const config =
    ENERGY_LEVELS.find((e) => e.id === level) || ENERGY_LEVELS[1];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border ${
        config.badgeClass
      } ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'}`}
      title={`Ritmo Circadiano: ${config.label} — ${config.description}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}

