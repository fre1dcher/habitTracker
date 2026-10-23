import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useSettings } from '../context/SettingsContext';

const EMOJIS = ['🎃', '👻', '🦇', '🕸️'];

/** Halloween season: all of October plus the first couple of days of November. */
const isHalloweenSeason = (d = new Date()): boolean => {
  const month = d.getMonth();
  return month === 9 || (month === 10 && d.getDate() <= 2);
};

export const SeasonalEgg = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [burst, setBurst] = useState(false);

  const on = !!settings.halloween;

  // Clean up the one-shot shower after it plays.
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(false), 2800);
    return () => clearTimeout(t);
  }, [burst]);

  // Show the pumpkin only in season, or whenever the theme is already on
  // (so it can always be switched back off).
  if (loading || (!isHalloweenSeason() && !on)) return null;

  const toggle = () => {
    const next = !on;
    updateSettings({ halloween: next });
    if (next) setBurst(true);
  };

  return (
    <>
      <button
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? 'Turn off spooky theme' : 'Turn on spooky theme'}
        title={on ? 'Spooky mode on' : 'Spooky mode'}
        className={clsx(
          'fixed bottom-6 right-4 z-40 w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-lg border backdrop-blur transition-all active:scale-90',
          on
            ? 'bg-orange-500/90 border-orange-400 shadow-orange-500/30'
            : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'
        )}
      >
        🎃
      </button>

      {burst && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 text-2xl will-change-transform"
              style={{
                left: `${(i * 8.3 + 3) % 100}%`,
                animation: `pumpkin-fall ${2 + (i % 4) * 0.25}s linear ${(i % 6) * 0.15}s forwards`,
              }}
            >
              {EMOJIS[i % EMOJIS.length]}
            </span>
          ))}
        </div>
      )}
    </>
  );
};
