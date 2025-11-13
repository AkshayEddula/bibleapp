/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        text: {
          DEFAULT: "#2C2C2E",
          secondary: "#6B6B70",
        },
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#2B5797",
          light: "#3A6BA8",
          dark: "#1E3F6B",
        },
        divider: "#E5E5E0",
        success: "#3A6B4A",
      },
      fontFamily: {
        lexend: ["Lexend-Regular"],
        "lexend-thin": ["Lexend-Thin"],
        "lexend-light": ["Lexend-Light"],
        "lexend-extralight": ["Lexend-ExtraLight"],
        "lexend-medium": ["Lexend-Medium"],
        "lexend-semibold": ["Lexend-SemiBold"],
        "lexend-bold": ["Lexend-Bold"],
        "lexend-extrabold": ["Lexend-ExtraBold"],
        Inter: ["Inter-Regular"],
        "Inter-thin": ["Inter-Thin"],
        "Inter-light": ["Inter-Light"],
        "Inter-extralight": ["Inter-ExtraLight"],
        "Inter-medium": ["Inter-Medium"],
        "Inter-semibold": ["Inter-SemiBold"],
        "Inter-bold": ["Inter-Bold"],
        "Inter-extrabold": ["Inter-ExtraBold"],
      },
    },
  },
  plugins: [],
};
