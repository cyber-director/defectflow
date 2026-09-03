/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // DefectFlow brand palette — CLAUDE.md §11. Placeholder until
        // the real logo file is swapped in; these are the exact hex
        // values the brief specifies.
        brand: {
          950: '#26322c',
          900: '#2f3e39',
          800: '#384b46',
          700: '#455753',
          600: '#54615d',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#eef1ef',
        },
        border: {
          DEFAULT: '#d7dcda',
        },
        ink: {
          primary: '#1f2925',
          secondary: '#66716d',
          muted: '#8a938f',
        },
        // Category accents — used sparingly (badges only), never as a
        // whole-page tint (CLAUDE.md §66).
        category: {
          structural: '#b45747',
          functional: '#3d7a91',
          performance: '#b8863b',
        },
        status: {
          submitted: '#64748b',
          assigned: '#2563eb',
          progress: '#b8863b',
          resolved: '#15803d',
        },
      },
      backgroundColor: {
        app: '#f4f6f5',
      },
    },
  },
  plugins: [],
}
