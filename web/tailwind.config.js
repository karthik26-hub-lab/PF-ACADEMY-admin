/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
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
        warn: { DEFAULT: 'hsl(var(--warn))', soft: 'hsl(var(--warn-soft))' },
        bad: { DEFAULT: 'hsl(var(--bad))', soft: 'hsl(var(--bad-soft))' },
      },
      borderRadius: { sm: '4px', DEFAULT: '6px', md: '8px', lg: '10px', xl: '12px' },
      boxShadow: {
        xs: '0 1px 2px 0 hsl(var(--shadow) / 0.05)',
        pop: '0 0 0 1px hsl(var(--border)), 0 8px 24px -6px hsl(var(--shadow) / 0.16), 0 2px 6px -2px hsl(var(--shadow) / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pop-in': { from: { opacity: 0, transform: 'translateY(4px) scale(0.98)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in 120ms ease-out', 'pop-in': 'pop-in 140ms cubic-bezier(0.2,0.8,0.2,1)' },
    },
  },
  plugins: [],
};
