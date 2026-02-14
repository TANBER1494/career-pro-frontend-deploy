/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",          
    "./src/**/*.{html,js}"  
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        lexend: ['Lexend', 'sans-serif'],
        albert: ['Albert Sans', 'sans-serif'],
        hegarty: ['BBH Hegarty', 'sans-serif'],
        screens: {
          'tablet-custom': '880px',   // النقطة التي ينقسم فيها الصف لاثنين
          'desktop-custom': '1390px', // النقطة التي يصبح فيها الصف ثلاثة
        },
      },

      animation: {
        marquee: 'marquee 25s linear infinite',
        glow: 'glow 1.5s infinite',
      },

      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
          glow: {
            '0%, 100%': { boxShadow: '0 0 10px #ff00ff' },
            '50%': { boxShadow: '0 0 20px #ff00ff' },
          },
      },
    },
  },
}