/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                'blue-950': '#050f2e',
                'blue-900': '#0e1e5b',
                'blue-800': '#1a3580',
                'blue-700': '#1247b8',
                'blue-600': '#1a5fd4',
                'blue-500': '#2b7eed',
                'blue-400': '#5ba0f5',
                'blue-300': '#93c3fa',
                'blue-200': '#c5dffe',
                'blue-100': '#e4f0ff',
                'blue-50':  '#f0f6ff',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'xl': '16px',
                '2xl': '20px',
                '3xl': '24px',
            },
        },
    },
    plugins: [],
}
