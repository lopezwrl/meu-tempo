import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

function AnimatedNumber({ value = 0, suffix = '' }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [renderedValue, setRenderedValue] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on('change', (latest) => {
      setRenderedValue(latest);
    });
  }, [display]);

  return (
    <span>
      {renderedValue}
      {suffix}
    </span>
  );
}

export function StatCard({
  title,
  value = 0,
  suffix = '',
  description,
  icon: Icon,
  progress = null, // 0 to 100
  progressLabel,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-surface rounded-2xl border border-primary-border/60 p-5 shadow-[0_2px_12px_rgba(236,72,153,0.03)] backdrop-blur-sm flex flex-col justify-between"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-text-3 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="my-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-baseline gap-1">
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
        {description && (
          <p className="text-xs text-text-3 mt-1 font-normal">{description}</p>
        )}
      </div>

      {progress !== null && (
        <div className="mt-4 pt-2">
          {progressLabel && (
            <div className="flex justify-between text-[11px] font-medium text-text-3 mb-1.5">
              <span>{progressLabel}</span>
              <span className="font-semibold text-text-2">{Math.min(100, Math.round(progress))}%</span>
            </div>
          )}
          <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

