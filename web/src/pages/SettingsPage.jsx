import { useState } from 'react';
import { Button } from '../components/ui/Button.jsx';
import { Sheet } from '../components/ui/Sheet.jsx';
import { useApp } from '../state/AppContext.jsx';
import { localTimeZone, WEEKDAY_SHORT } from '../lib/date.js';

const START_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 0, label: 'Sunday' },
  { value: 6, label: 'Saturday' },
];

export function SettingsPage() {
  const { user, dashboard, signOut, updateProfile, deleteHabit, syncNow, pushToast } = useApp();
  const [name, setName] = useState(user.name);
  const [busy, setBusy] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  const saveProfile = async (patch) => {
    setBusy('profile');
    await updateProfile(patch);
    setBusy('');
  };

  const wipeEverything = async () => {
    setBusy('reset');
    for (const habit of dashboard.habits) await deleteHabit(habit.id);
    setBusy('');
    setResetOpen(false);
    pushToast({ tone: 'info', title: 'Fresh start', message: 'All habits and their history are gone.' });
  };

  return (
    <div className="space-y-4">
      <section className="surface p-5">
        <div className="flex flex-wrap items-center gap-4">
          {user.picture ? (
            <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-16 w-16 rounded-pill object-cover ring-2 ring-forest-200" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-pill bg-forest-100 font-display text-[22px] font-extrabold text-forest-800">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="label">Profile</p>
            <h1 className="font-display text-[24px] font-extrabold leading-tight">{user.name}</h1>
            <p className="text-[12px] font-bold text-ink-mute">{user.email || 'signed in'} · {dashboard.totals.totalCompleted.toLocaleString()} check-ins logged</p>
          </div>
          <Button variant="quiet" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Display name</span>
            <div className="mt-1.5 flex gap-2">
              <input className="field" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
              <Button size="sm" onClick={() => saveProfile({ name })} loading={busy === 'profile'} disabled={!name.trim() || name === user.name}>
                Save
              </Button>
            </div>
          </label>

          <div>
            <span className="label">Week starts on</span>
            <div className="mt-1.5 flex gap-2">
              {START_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => saveProfile({ startOfWeek: option.value })}
                  className={`tap-target flex-1 rounded-pill border px-3 py-2 text-[13px] font-black ${
                    user.startOfWeek === option.value ? 'border-forest-600 bg-forest-600 text-white' : 'border-line bg-white text-ink-soft'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-bold text-ink-mute">
              Your grid follows this. Streaks are counted in {dashboard.timezone}.
            </p>
          </div>
        </div>
      </section>

      <section className="surface p-5">
        <p className="label">Streaks</p>
        <h2 className="text-[20px] leading-tight">Keep everything current</h2>
        <p className="mt-1 max-w-[68ch] text-[13px] font-bold text-ink-soft">
          Verdant scores each day the moment it ends in your timezone, unlocks milestones and warns you before a live streak runs out at midnight.
        </p>
        <div className="mt-4">
          <Button variant="soft" size="sm" onClick={() => syncNow()} loading={busy === 'sync'}>
            Sync my streaks now
          </Button>
        </div>
      </section>

      <section className="surface p-5">
        <p className="label">Keyboard</p>
        <h2 className="text-[20px] leading-tight">Shortcuts</h2>
        <ul className="mt-3 grid gap-2 text-[13px] font-bold sm:grid-cols-2">
          {[
            ['N', 'New habit'],
            ['R', 'Refresh'],
            ['1 – 9', 'Toggle a habit for today'],
            ['← →', 'Move through weeks'],
            ['Esc', 'Close any panel'],
          ].map(([key, action]) => (
            <li key={key} className="flex items-center gap-2.5">
              <kbd className="rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-black text-forest-800">{key}</kbd>
              {action}
            </li>
          ))}
        </ul>
      </section>

      <section className="surface p-5">
        <p className="label">Your data</p>
        <h2 className="text-[20px] leading-tight">Start over</h2>
        <p className="mt-1 max-w-[68ch] text-[13px] font-bold text-ink-soft">
          Deletes every habit, every logged day and every unlock on this account. There is no undo.
        </p>
        <div className="mt-4">
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
            Delete all my habits
          </Button>
        </div>
        <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-ink-mute">
          {dashboard.habits.length} habits · {WEEKDAY_SHORT.join(' · ')} · browser says {localTimeZone()}
        </p>
      </section>

      <Sheet open={resetOpen} onClose={() => setResetOpen(false)} side="bottom" title="Delete everything?" subtitle="This clears your whole forest.">
        <p className="text-[14px] font-bold text-ink-soft">
          {dashboard.habits.length} habits, {dashboard.totals.totalCompleted.toLocaleString()} logged days and {dashboard.achievements.filter((entry) => entry.unlocked).length} unlocked milestones will be removed.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="quiet" size="sm" onClick={() => setResetOpen(false)}>
            Keep my data
          </Button>
          <Button variant="danger" size="sm" onClick={wipeEverything} loading={busy === 'reset'}>
            Yes, delete all
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
