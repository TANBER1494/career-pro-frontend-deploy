/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",           // ملف الهوم اللي برا خالص
    "./src/**/*.{html,js}"    // السطر السحري: بيغطي كل الفولدرات الجديدة (controllers, pages, steps, etc.)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  extend: {
    fontFamily: {
      poppins: ["Poppins", "sans-serif"],
    },
  }  
}