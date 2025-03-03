/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#007AFF',
                secondary: '#64748B',
                background: '#F8FAFC',
                surface: '#FFFFFF',
            },
            spacing: {
                '18': '4.5rem',
            },
            borderRadius: {
                'xl': '1rem',
            },
        },
    },
    plugins: [],
} 