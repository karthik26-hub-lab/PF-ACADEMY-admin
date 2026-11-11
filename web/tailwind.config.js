/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        hand: ['Caveat', '"Segoe Print"', 'cursive'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      fontSize: { '2xs': ['11px', '16px'], xs: ['12px', '16px'], sm: ['13px', '20px'], base: ['14px', '22px'] },
      colors: {
        bg: 'hsl(var(--bg))',
        panel: 'hsl(var(--panel))',
        subtle: 'hsl(var(--subtle))',
        hover: 'hsl(var(--hover))',
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        fg: 'hsl(var(--fg))',
        muted: 'hsl(var(--muted))',
        faint: 'hsl(var(--faint))',
        accent: { DEFAULT: 'hsl(var(--accent))', fg: 'hsl(var(--accent-fg))', soft: 'hsl(var(--accent-soft))' },
        good: { DEFAULT: 'hsl(var(--good))', soft: 'hsl(var(--good-soft))' },
        pop: { DEFAULT: 'hsl(var(--pop))', fg: 'hsl(var(--pop-fg))' },
        coral: { DEFAULT: 'hsl(var(--coral))', fg: 'hsl(var(--coral-fg))' },
        sun: { DEFAULT: 'hsl(var(--sun))', fg: 'hsl(var(--sun-fg))' },
        warn: { DEFAULT: 'hsl(var(--warn))', soft: 'hsl(var(--warn-soft))' },
        bad: { DEFAULT: 'hsl(var(--bad))', soft: 'hsl(var(--bad-soft))' },
      },
      borderRadius: { sm: '6px', DEFAULT: '8px', md: '10px', lg: '14px', xl: '18px', '2xl': '22px', '3xl': '28px' },
      boxShadow: {
        xs: '0 1px 2px 0 hsl(var(--shadow) / 0.05)',
        float: '0 0 0 1px hsl(var(--border)), 0 8px 24px -6px hsl(var(--shadow) / 0.16), 0 2px 6px -2px hsl(var(--shadow) / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'fade-out': { from: { opacity: 1 }, to: { opacity: 0 } },
        'dialog-in': { from: { opacity: 0, transform: 'translate(-50%, 10px) scale(0.97)' }, to: { opacity: 1, transform: 'translate(-50%, 0) scale(1)' } },
        'dialog-out': { from: { opacity: 1, transform: 'translate(-50%, 0) scale(1)' }, to: { opacity: 0, transform: 'translate(-50%, 6px) scale(0.98)' } },
        'menu-in': { from: { opacity: 0, transform: 'scale(0.96) translateY(-4px)' }, to: { opacity: 1, transform: 'none' } },
        'menu-out': { from: { opacity: 1, transform: 'none' }, to: { opacity: 0, transform: 'scale(0.97)' } },
        'pop-in': { from: { opacity: 0, transform: 'translateY(4px) scale(0.98)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out', 'fade-out': 'fade-out 120ms ease-in forwards',
        'dialog-in': 'dialog-in 260ms cubic-bezier(0.16,1,0.3,1)', 'dialog-out': 'dialog-out 150ms ease-in forwards',
        'menu-in': 'menu-in 180ms cubic-bezier(0.16,1,0.3,1)', 'menu-out': 'menu-out 110ms ease-in forwards',
        'pop-in': 'pop-in 220ms cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};
