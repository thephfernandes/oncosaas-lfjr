import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        // Prioridades
        priority: {
          critical: '#ef4444',
          high: '#f59e0b',
          medium: '#10b981',
          low: '#6b7280',
        },
        // Cores Profissionais Médicas
        medical: {
          blue: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9', // sky-500 - Azul médico principal
            600: '#0284c7', // sky-600 - Azul médico escuro
            700: '#0369a1', // sky-700 - Azul médico mais escuro
            800: '#075985',
            900: '#0c4a6e',
          },
          green: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981', // emerald-500 - Verde médico principal
            600: '#059669', // emerald-600 - Verde médico escuro
            700: '#047857', // emerald-700 - Verde médico mais escuro
            800: '#065f46',
            900: '#064e3b',
          },
          alert: {
            critical: '#dc2626', // red-600 - Mais suave que red-500
            high: '#ea580c', // orange-600 - Mais suave que orange-500
            medium: '#f59e0b', // amber-500
            low: '#6b7280', // gray-500
          },
        },
      },
      backgroundImage: {
        'gradient-medical-blue':
          'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        'gradient-medical-green':
          'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-medical-blue-vertical':
          'linear-gradient(180deg, #0ea5e9 0%, #0369a1 100%)',
        'gradient-medical-green-vertical':
          'linear-gradient(180deg, #10b981 0%, #047857 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
export default config;
