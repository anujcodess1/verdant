const VARIANTS = {
  primary: 'bg-forest-700 text-white hover:bg-forest-800 shadow-card active:shadow-none border border-forest-800',
  sprout: 'bg-forest-500 text-white hover:bg-forest-600 border border-forest-600 shadow-card',
  soft: 'bg-forest-50 text-forest-800 hover:bg-forest-100 border border-forest-200',
  quiet: 'bg-white/70 text-ink-soft hover:bg-white border border-line',
  ghost: 'bg-transparent text-ink-soft hover:bg-forest-50 border border-transparent',
  danger: 'bg-white text-red-700 hover:bg-red-50 border border-red-200',
  ember: 'bg-ember-500 text-white hover:bg-ember-600 border border-ember-600 shadow-glow',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-[13px] rounded-pill',
  md: 'px-4 py-2.5 text-[15px] rounded-pill',
  lg: 'px-6 py-3.5 text-[16px] rounded-pill',
  icon: 'h-10 w-10 rounded-pill justify-center',
};

export function Button({ variant = 'primary', size = 'md', className = '', loading, children, ...rest }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`tap-target inline-flex items-center gap-2 font-extrabold disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
