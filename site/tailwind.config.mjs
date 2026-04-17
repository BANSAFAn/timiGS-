/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        display: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        cyber: {
          bg: "#060609",
          surface: "#0a0a12",
          elevated: "#0f0f1a",
          panel: "#111126",
          border: "rgba(6,245,214,0.12)",
          cyan: "#06f5d6",
          purple: "#a855f7",
          blue: "#3b82f6",
          pink: "#ec4899",
          green: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444",
        },
      },
      animation: {
        "cyber-scan": "cyber-scan 4s linear infinite",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
        "neon-border": "neon-border 3s ease-in-out infinite",
        "glitch": "glitch 3s infinite",
        "hex-float": "hex-float 8s ease-in-out infinite",
        "data-stream": "data-stream 15s linear infinite",
        "grid-scroll": "grid-scroll 25s linear infinite",
        "fade-in-up": "fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-in-left": "slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right": "slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spin-slow 20s linear infinite",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "loader-spin": "loader-spin 1.2s linear infinite",
        "loader-pulse": "loader-pulse 1.5s ease-in-out infinite",
        "corner-flash": "corner-flash 2s ease-in-out infinite",
        "text-glow": "text-glow 2s ease-in-out infinite",
        "scan-reveal": "scan-reveal 0.8s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        "cyber-scan": {
          "0%": { transform: "translateY(-100%)", opacity: "0.5" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0.5" },
        },
        "neon-pulse": {
          "0%, 100%": { opacity: "0.4", boxShadow: "0 0 5px currentColor" },
          "50%": { opacity: "1", boxShadow: "0 0 20px currentColor, 0 0 40px currentColor" },
        },
        "neon-border": {
          "0%, 100%": { borderColor: "rgba(6,245,214,0.15)" },
          "50%": { borderColor: "rgba(6,245,214,0.4)" },
        },
        "glitch": {
          "0%, 100%": { transform: "translate(0)" },
          "33%": { transform: "translate(-2px, 1px)" },
          "66%": { transform: "translate(2px, -1px)" },
        },
        "hex-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)", opacity: "0.15" },
          "50%": { transform: "translateY(-30px) rotate(30deg)", opacity: "0.3" },
        },
        "data-stream": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" },
        },
        "grid-scroll": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "60px 60px" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.05)" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "loader-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "loader-pulse": {
          "0%, 100%": { transform: "scale(0.8)", opacity: "0.3" },
          "50%": { transform: "scale(1.2)", opacity: "0.8" },
        },
        "corner-flash": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "text-glow": {
          "0%, 100%": { textShadow: "0 0 10px rgba(6,245,214,0.3)" },
          "50%": { textShadow: "0 0 20px rgba(6,245,214,0.6), 0 0 40px rgba(6,245,214,0.3)" },
        },
        "scan-reveal": {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0 0 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
