/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
theme: {
  extend: {
    colors: {
      navy: "#0D1B2A",
      gold: "#E0B400",
      cream: "#F7F4EE",
      ink: "#0B0F14",
    },
    borderRadius: {
      xl: "1rem",
      "2xl": "1.25rem",
    },
    boxShadow: {
      soft: "0 6px 20px rgba(13, 27, 42, 0.12)",
    },
  },
},

  plugins: [],
};
