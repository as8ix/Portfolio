/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                arabic: ['Cairo', 'sans-serif'],
            },
            colors: {
                primary: '#000000',
                secondary: '#ffffff',
            },
        },
    },
    plugins: [],
}
