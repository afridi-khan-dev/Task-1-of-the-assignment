/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          navy: {
            deep: "#0B1329",      // Premium background
            dark: "#111B35",      // Surface cards
            light: "#1C2A4A",     // Hover/borders
            text: "#E2E8F0"
          },
          indigo: {
            light: "#818CF8",
            primary: "#6366F1",   // Accent AI elements
            dark: "#4F46E5"
          },
          emerald: {
            light: "#34D399",
            primary: "#10B981"    // Compliant/Positive sentiment
          },
          amber: {
            primary: "#F59E0B"    // Risk warnings
          },
          rose: {
            primary: "#EF4444"    // Compliance infractions
          }
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
