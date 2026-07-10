/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Brand core ───────────────────────────────
        'mint-navy': '#0F2040',   // darkest navy  – primary CTA, sidebar
        'mint-blue': '#1A3D6B',   // mid navy      – hover, active nav
        'mint-steel': '#2E5B8A',   // steel blue    – links, secondary accents
        'mint-pale': '#E8EFF8',   // pale sky      – hover bg, input fill

        // ─── Ethiopian flag ───────────────────────────
        'eth-green': '#078930',
        'eth-yellow': '#FCDD09',
        'eth-red': '#B91C1C',

        // ─── Surfaces ─────────────────────────────────
        'surface-white': '#FFFFFF',
        'surface-page': '#F0F4FA',
        'surface-input': '#F7F9FC',

        // ─── Borders ──────────────────────────────────
        'border-default': '#DDE2ED',
        'border-subtle': '#EEF1F7',
        'border-strong': '#B8C2D8',

        // ─── Text ─────────────────────────────────────
        'text-primary': '#0F2040',
        'text-secondary': '#374151',
        'text-muted': '#4A5568',
        'text-hint': '#8898B4',

        // ─── Status colors (palette-only, no off-brand) ─
        'status-pending-bg': '#FEF9ED',
        'status-pending-text': '#92600A',
        'status-pending-dot': '#C47900',

        'status-approved-bg': '#EDFAF2',
        'status-approved-text': '#065F36',
        'status-approved-dot': '#078930',

        'status-hold-bg': '#FFF4EC',
        'status-hold-text': '#7C3400',
        'status-hold-dot': '#C04A00',

        'status-rejected-bg': '#FEF2F2',
        'status-rejected-text': '#8B1A1A',
        'status-rejected-dot': '#B91C1C',

        'status-completed-bg': '#EBF2FA',
        'status-completed-text': '#15366B',
        'status-completed-dot': '#2E5B8A',

        'status-eval-bg': '#F0F4F8',
        'status-eval-text': '#2D4A6B',
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        ethiopic: ['"Noto Sans Ethiopic"', 'sans-serif'],
      },
      fontSize: {
        'display': ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'h1': ['1.625rem', { lineHeight: '2.125rem', fontWeight: '700' }],
        'h2': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'h3': ['1.0625rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.625rem', fontWeight: '400' }],
        'body': ['0.9375rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1.125rem', fontWeight: '600' }],
        'caption': ['0.6875rem', { lineHeight: '1rem', fontWeight: '400' }],
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '10px',
        'lg': '14px',
        'pill': '999px',
      },
      boxShadow: {
        'level-1': '0 1px 3px 0 rgba(15,32,64,0.07), 0 1px 2px -1px rgba(15,32,64,0.05)',
        'level-2': '0 4px 12px -2px rgba(15,32,64,0.10), 0 2px 6px -2px rgba(15,32,64,0.06)',
        'level-3': '0 10px 30px -4px rgba(15,32,64,0.13), 0 4px 10px -4px rgba(15,32,64,0.07)',
        'focus': '0 0 0 3px rgba(26,61,107,0.18)',
      },
    },
  },
  plugins: [],
}