
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // UI text sizes
        'ui-xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        'ui-sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'ui-base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.01em' }],
        // Display text sizes
        'display-sm': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'display-base': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],
        'display-lg': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(-5px) translateX(3px)" },
          "50%": { transform: "translateY(0) translateX(5px)" },
          "75%": { transform: "translateY(5px) translateX(2px)" },
        },
        "float-slower": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(3px) translateX(-5px)" },
          "50%": { transform: "translateY(-3px) translateX(0)" },
          "75%": { transform: "translateY(5px) translateX(-3px)" },
        },
        "float-slowest": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "30%": { transform: "translateY(-3px) translateX(2px)" },
          "60%": { transform: "translateY(3px) translateX(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "float-slower": "float-slower 8s ease-in-out infinite",
        "float-slowest": "float-slowest 10s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
