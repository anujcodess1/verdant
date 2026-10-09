import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon.jsx';
import { loadGoogleIdentity, renderGoogleButton } from '../lib/google.js';
import { useApp } from '../state/AppContext.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export function LoginScreen() {
  const { signInWithGoogle } = useApp();
  const buttonRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tiles = [
    ...Array.from({ length: 84 }, (_, index) => ({
      id: index,
      level: [0, 1, 2, 1, 3, 4, 2, 1, 3, 2][index % 10],
      delay: (index % 12) * 0.05,
    })),
  ];
  const palette = ['#e6efe8', '#bde5c9', '#83d0a5', '#41ac79', '#125e3b'];

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Sign-in is not configured yet.');
      return undefined;
    }
    let cancelled = false;
    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        renderGoogleButton(buttonRef.current, {
          clientId: GOOGLE_CLIENT_ID,
          onSuccess: async (credential) => {
            setBusy(true);
            setError('');
            try {
              await signInWithGoogle(credential);
            } catch (err) {
              setBusy(false);
              setError(err.status === 401 ? 'That Google account could not be verified. Please try again.' : 'Could not reach the garden. Check your connection.');
            }
          },
          onError: () => {
            setBusy(false);
            setError('Sign-in was cancelled.');
          },
        });
      })
      .catch(() => setError('Could not load Google sign-in. Check your connection.'));
    return () => {
      cancelled = true;
    };
  }, [signInWithGoogle]);

  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-[1180px] items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
      <div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }}>
          <span className="chip">
            <span className="h-2 w-2 rounded-full bg-forest-500" /> habit tracker · streak analytics
          </span>
          <h1 className="mt-4 font-display text-[44px] font-extrabold leading-[0.98] tracking-tight sm:text-[62px]">
            Grow a forest
            <br />
            <span className="text-forest-700">out of your habits.</span>
          </h1>
          <p className="mt-4 max-w-[46ch] text-[16px] font-bold leading-relaxed text-ink-soft balance">
            Tap the grid, keep your streaks alive, and watch milestones unlock. Verdant scores every scheduled day, forgives the days a habit was not due, and remembers the run you are on.
          </p>

          <ul className="mt-6 grid max-w-[520px] grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              { icon: 'grid', text: 'Your year on one heatmap' },
              { icon: 'calendar', text: 'Tap-any-day habit grid' },
              { icon: 'flame', text: 'Streaks that respect your schedule' },
              { icon: 'medal', text: 'Milestones worth chasing' },
            ].map((item, index) => (
              <motion.li
                key={item.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.06 }}
                className="flex items-center gap-2.5 rounded-2xl border border-line bg-white/80 px-3 py-2.5 text-[13px] font-black"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-forest-50 text-forest-700">
                  <Icon name={item.icon} size={16} />
                </span>
                {item.text}
              </motion.li>
            ))}
          </ul>

          <div className="mt-8 max-w-[320px] space-y-3">
            <div className={busy ? 'pointer-events-none opacity-60' : ''} ref={buttonRef} aria-label="Continue with Google" />
            {busy ? <p className="text-center text-[12px] font-black text-ink-mute">Setting up your forest…</p> : null}
            {error ? <p className="text-center text-[12px] font-bold text-red-700">{error}</p> : null}
            <p className="text-center text-[11px] font-bold text-ink-mute">Free while you grow. Your habits stay private to your account.</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 26, delay: 0.1 }}
        className="surface grain relative hidden overflow-hidden p-6 lg:block"
      >
        <p className="label">What your year looks like</p>
        <h2 className="text-[22px] leading-tight">Every day you show up, a square greens up</h2>
        <div className="mt-4 grid grid-flow-col grid-rows-7 gap-[6px]">
          {tiles.map((tile) => (
            <motion.span
              key={tile.id}
              className="h-4 w-4 rounded-[5px]"
              style={{ backgroundColor: palette[tile.level] }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + tile.delay, duration: 0.35 }}
            />
          ))}
        </div>

        <div className="mt-6 space-y-2.5">
          {[
            { name: 'Deep Work', icon: 'target', streak: 14, pct: 86 },
            { name: 'Morning Run', icon: 'run', streak: 6, pct: 71 },
            { name: 'Read 20 Pages', icon: 'book', streak: 21, pct: 93 },
          ].map((row, index) => (
            <motion.div
              key={row.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-2.5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700">
                <Icon name={row.icon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-black leading-tight">{row.name}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-forest-50">
                  <motion.div className="h-full rounded-pill bg-forest-500" initial={{ width: 0 }} animate={{ width: `${row.pct}%` }} transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }} />
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-ember-200/60 px-2 py-1 text-[12px] font-black text-ember-600">
                <Icon name="flame" size={13} filled className="text-ember-500" />
                {row.streak}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </main>
  );
}
