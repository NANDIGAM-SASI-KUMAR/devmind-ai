/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        // Warm dark "archive paper" palette
        paper: '#0E0D0B',
        ink: {
          DEFAULT: '#F2EDE3',
          muted: '#B8AE9C',
          faint: '#6B6358',
          ghost: '#3A352D'
        },
        surface: {
          DEFAULT: '#15120E',
          raised: '#1C1812',
          higher: '#241F18'
        },
        rule: {
          subtle: '#22201B',
          DEFAULT: '#2E2A22',
          strong: '#4A4439'
        },
        // Signature electric lime — the ONE color you remember
        signal: '#D4FF3A',
        warm: '#FF6B35',
        cool: '#5B8FE5',
        agent: {
          planner: '#D4FF3A',
          coder: '#FF6B35',
          debugger: '#FFB627',
          docs: '#5B8FE5'
        }
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.02em'
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'marquee': 'marquee 40s linear infinite',
        'blink': 'blink 1.2s steps(2, end) infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'scan': 'scan 2s ease-in-out infinite'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' }
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.9)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' }
        },
        scan: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(100%)' }
        }
      }
    }
  },
  plugins: []
};
