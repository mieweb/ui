/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@mieweb/datavis/dist/**/*.{js,ts,jsx,tsx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('./src/tailwind-preset.cjs')],
  darkMode: ['class', '[data-theme="dark"]'],
};
