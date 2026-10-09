import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from './Icon.jsx';

const TABS = [
  { to: '/', label: 'Today', icon: 'sprout' },
  { to: '/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/trophies', label: 'Trophies', icon: 'trophy' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function TopBar({ user, unread, onOpenNotifications, onCompose }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest-800 text-forest-200 shadow-card">
              <Icon name="pine" size={21} />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[19px] font-extrabold tracking-tight">Verdant</span>
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-ink-mute">habit forest</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `tap-target rounded-pill px-3.5 py-2 text-[14px] font-black ${isActive ? 'bg-forest-700 text-white' : 'text-ink-soft hover:bg-forest-50'}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label={`Milestone alerts${unread ? `, ${unread} unread` : ''}`}
              className="tap-target relative grid h-10 w-10 place-items-center rounded-pill border border-line bg-white text-forest-700"
            >
              <Icon name="bell" size={19} />
              {unread ? (
                <motion.span
                  key={unread}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-pill bg-ember-500 px-1 text-[11px] font-black text-white"
                >
                  {unread}
                </motion.span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={onCompose}
              className="tap-target hidden items-center gap-1.5 rounded-pill bg-forest-700 px-4 py-2 text-[14px] font-black text-white hover:bg-forest-800 sm:flex"
            >
              <Icon name="plus" size={15} strokeWidth={2.4} />
              New habit
            </button>

            {user ? (
              <span className="hidden items-center gap-2 rounded-pill border border-line bg-white py-1 pl-1 pr-3 sm:flex">
                {user.picture ? (
                  <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-pill object-cover" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-pill bg-forest-100 text-[13px] font-black text-forest-800">
                    {user.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="max-w-[110px] truncate text-[13px] font-black">{user.name.split(' ')[0]}</span>
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-white/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="mx-auto flex max-w-[520px] items-stretch">
          {TABS.map((tab) => (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `tap-target flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-black ${isActive ? 'text-forest-700' : 'text-ink-mute'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={tab.icon} size={19} className={isActive ? 'text-forest-600' : ''} />
                    <span>{tab.label}</span>
                    {isActive ? <motion.span layoutId="navDot" className="mt-0.5 h-1 w-8 rounded-pill bg-forest-600" /> : <span className="mt-0.5 h-1 w-8" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
