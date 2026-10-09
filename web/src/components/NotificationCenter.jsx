import { Sheet } from './ui/Sheet.jsx';
import { Button } from './ui/Button.jsx';
import { Icon } from './Icon.jsx';
import { relativeDay } from '../lib/date.js';

const KIND_STYLE = {
  milestone: { icon: 'medal', tone: 'bg-ember-200/50 border-ember-300' },
  perfect_day: { icon: 'tree', tone: 'bg-forest-50 border-forest-200' },
  streak_saved: { icon: 'flame', tone: 'bg-ember-200/40 border-ember-200' },
  streak_lost: { icon: 'flower', tone: 'bg-white border-line' },
  welcome: { icon: 'sprout', tone: 'bg-forest-50 border-forest-200' },
};

export function NotificationCenter({ open, notifications, today, onClose, onMarkRead, onDelete }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      title="Milestone alerts"
      subtitle="Cron settles each day boundary and reports what changed."
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="quiet" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={() => onMarkRead()} disabled={notifications.every((item) => item.read)}>
            Mark all read
          </Button>
        </div>
      }
    >
      {notifications.length === 0 ? (
        <div className="py-12 text-center">
          <Icon name="leaf" size={34} className="mx-auto text-forest-300" />
          <p className="mt-2 text-[16px] font-black">Quiet in the forest</p>
          <p className="mt-1 text-[13px] font-bold text-ink-mute">Milestones and day-boundary alerts land here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((entry) => {
            const style = KIND_STYLE[entry.kind] ?? KIND_STYLE.welcome;
            return (
              <li
                key={entry.id}
                className={`flex items-start gap-3 rounded-2xl border px-3 py-3 ${style.tone} ${entry.read ? 'opacity-70' : ''}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-forest-700 shadow-sm">
                  <Icon name={style.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-black leading-tight">{entry.title}</p>
                  <p className="mt-0.5 text-[12px] font-bold text-ink-soft">{entry.body}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-ink-mute">
                    {relativeDay(entry.createdAt.slice(0, 10), today)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {!entry.read ? <span className="h-2.5 w-2.5 rounded-full bg-forest-600" /> : null}
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    aria-label="Dismiss alert"
                    className="tap-target grid h-7 w-7 place-items-center rounded-pill border border-white/70 bg-white/70 text-[12px] font-black text-ink-mute"
                  >
                    <Icon name="close" size={13} strokeWidth={2.4} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
