import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../Icon.jsx';

export function Sheet({ open, onClose, title, subtitle, icon, children, footer, side = 'right' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const slide = side === 'right' ? { x: 48 } : { y: 48 };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-stretch justify-end sm:items-center sm:justify-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-forest-950/40 backdrop-blur-[3px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, ...slide, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, ...slide, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.7 }}
            className={`surface relative z-10 flex h-full w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[88vh] sm:rounded-card ${side === 'right' ? 'sm:w-[min(560px,92vw)]' : 'sm:w-[min(760px,94vw)]'}`}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line/80 px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                {icon ? (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700">
                    <Icon name={icon} size={20} />
                  </span>
                ) : null}
                <div className="min-w-0">
                  <h2 className="text-[22px] leading-tight">{title}</h2>
                  {subtitle ? <p className="mt-1 text-[13px] font-bold text-ink-mute">{subtitle}</p> : null}
                </div>
              </div>
              <button type="button" onClick={onClose} className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-line text-ink-mute hover:bg-forest-50" aria-label="Close panel">
                <Icon name="close" size={15} strokeWidth={2.2} />
              </button>
            </header>
            <div className="hide-scroll flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
            {footer ? <footer className="safe-bottom border-t border-line/80 bg-white/80 px-5 py-4">{footer}</footer> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
