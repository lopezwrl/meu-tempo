import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export function AchievementBadge({ achievement, index = 0 }) {
  const isUnlocked = achievement.unlocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
        isUnlocked
          ? 'bg-surface border-primary-border/70 shadow-sm shadow-pink-500/5'
          : 'bg-surface-2/40 border-primary-border/30 opacity-60'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-base ${
          isUnlocked
            ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-md shadow-pink-500/20'
            : 'bg-surface-2 text-text-3 border border-primary-border/40'
        }`}
      >
        {isUnlocked ? (
          <span>{achievement.icon || '🏆'}</span>
        ) : (
          <Lock className="w-4 h-4 text-text-3" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-xs font-bold text-text truncate">
            {achievement.title}
          </h4>
          {isUnlocked && (
            <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded-full bg-primary-soft">
              Conquistado
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-3 mt-0.5 leading-relaxed">
          {achievement.description}
        </p>
      </div>
    </motion.div>
  );
}

