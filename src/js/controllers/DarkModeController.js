const themeCheckbox = document.getElementById('checkboxInput');
const html = document.documentElement; // الأفضل نتحكم في الـ html tag

function applyTheme(isDark) {
    if (isDark) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeCheckbox) themeCheckbox.checked = false; // القمر ظاهر (Checkbox غير مفعل)
    } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (themeCheckbox) themeCheckbox.checked = true;
    }
}

const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme === 'dark');

if (themeCheckbox) {
    themeCheckbox.addEventListener('change', () => {
        applyTheme(!themeCheckbox.checked);
    });
}
