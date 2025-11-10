/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
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
      fontFamily: {
        lexend: ["Lexend-Regular"],
        "lexend-thin": ["Lexend-Thin"],
        "lexend-light": ["Lexend-Light"],
        "lexend-extralight": ["Lexend-ExtraLight"],
        "lexend-medium": ["Lexend-Medium"],
        "lexend-semibold": ["Lexend-SemiBold"],
        "lexend-bold": ["Lexend-Bold"],
        "lexend-extrabold": ["Lexend-ExtraBold"],
      },
    },
  },
  plugins: [],
};
