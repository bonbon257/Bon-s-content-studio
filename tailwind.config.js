/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: [
          '"Inter Tight"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        cream: '#FAF7F1',
        paper: '#FFFFFF',
        canvas: '#FFFFFF',
        panel: '#F4EFE6',
        rail: '#F4EFE6',
        hover: '#EFE9DD',
        line: '#E8E1D4',
        hairline: '#D9D0BE',
        ink: '#171411',
        graphite: '#3A332C',
        muted: '#857F75',
        ember: '#D9461F',
        emberSoft: '#FBE6DD',
        moss: '#33715B',
        mossSoft: '#E1ECE5',
        sky: '#2A6FB8',
        skySoft: '#E2EBF6',
        accent: '#D9461F',
        tag: '#D9461F',
        success: '#33715B',
        warn: '#B07515',
        warning: '#B07515',
      },
      maxWidth: {
        page: '880px',
        column: '720px',
      },
      boxShadow: {
        paper: '0 1px 0 rgba(23, 20, 17, 0.04), 0 8px 24px -12px rgba(23, 20, 17, 0.08)',
        lift: '0 1px 0 rgba(23, 20, 17, 0.05), 0 14px 30px -14px rgba(23, 20, 17, 0.18)',
        ember: '0 0 0 3px rgba(217, 70, 31, 0.15)',
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
    },
  },
  plugins: [],
};
