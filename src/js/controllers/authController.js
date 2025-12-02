import AuthService from '../services/authService.js';

// ==========================================
// 1. UI Helper Functions (منطق الواجهة)
// ==========================================

// دالة تحديث طول الكارت ديناميكياً
const updateCardHeight = (isSignup) => {
    const container = document.getElementById('mainContainer');
    const front = document.getElementById('frontFace');
    const back = document.getElementById('backFace');

    if (container && front && back) {
        // نزيد هامش بسيط للأمان
        const height = isSignup ? back.scrollHeight + 20 : front.scrollHeight + 20;
        container.style.height = `${height}px`;
    }
};

// دالة القلب (Flip)
const flipCard = () => {
    const cardInner = document.getElementById('cardInner');
    if (cardInner) {
        const isCurrentlySignup = cardInner.classList.contains('rotate-y-180');
        
        // تبديل الكلاس
        cardInner.classList.toggle('rotate-y-180');
        
        // تحديث الطول بناءً على الوجه الجديد (عكس الحالي)
        updateCardHeight(!isCurrentlySignup);
    }
};

// دالة إظهار/إخفاء الباسورد
const setupPasswordToggles = () => {
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const input = e.target.previousElementSibling; // الحقل اللي قبل الأيقونة
            if (input && input.tagName === 'INPUT') {
                if (input.type === 'password') {
                    input.type = 'text';
                    e.target.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    input.type = 'password';
                    e.target.classList.replace('fa-eye-slash', 'fa-eye');
                }
            }
        });
    });
};

// دالة تبديل نوع الحساب (Job Seeker / Company)
const setupAccountTypeToggle = () => {
    const radios = document.querySelectorAll('input[name="accountTypeRadio"]');
    const jobFields = document.getElementById('jobSeekerFields');
    const compFields = document.getElementById('companyFields');
    const hiddenSelect = document.getElementById('accountType');

    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const type = e.target.value;
            
            // تحديث الـ Select المخفي (لو محتاجينه)
            if (hiddenSelect) hiddenSelect.value = type;

            if (type === 'company') {
                jobFields.classList.add('hidden');
                compFields.classList.remove('hidden');
            } else {
                jobFields.classList.remove('hidden');
                compFields.classList.add('hidden');
            }
            
            // تحديث الطول لأن المحتوى اتغير
            setTimeout(() => updateCardHeight(true), 50);
        });
    });
};

// ==========================================
// 2. Initialization (عند تحميل الصفحة)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // أ) تشغيل أزرار القلب (Flip Buttons)
    // لاحظي: في HTML لازم ندي الأزرار كلاس اسمه 'flip-btn'
    document.querySelectorAll('.flip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // منع أي سلوك افتراضي
            flipCard();
        });
    });

    // ب) تشغيل باقي أدوات الواجهة
    setupPasswordToggles();
    setupAccountTypeToggle();

    // ج) التحقق من الرابط (هل جاي من Start Journey؟)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'signup') {
        const cardInner = document.getElementById('cardInner');
        if (cardInner) {
            cardInner.style.transition = 'none'; // إلغاء الانيميشن لحظياً
            cardInner.classList.add('rotate-y-180');
            updateCardHeight(true);
            
            setTimeout(() => {
                cardInner.style.transition = ''; // إرجاع الانيميشن
            }, 100);
        }
    } else {
        updateCardHeight(false);
    }
});


// ==========================================
// 3. Form Submission Logic (معالجة البيانات)
// ==========================================

// --- معالجة Login ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = 'Loading...';
        btn.disabled = true;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const data = await AuthService.login({ email, password });

            // حفظ التوكن
            if (data.token) localStorage.setItem('authToken', data.token);
            
            // حفظ اليوزر والتوجيه
            if (data.data && data.data.user) {
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                const type = data.data.user.accountType;
                if (type === 'company') {
                    window.location.href = '../Company/CompanyPortal/dashboard.html'; // تأكدي من المسار
                } else {
                    window.location.href = '../seeker/profile/profile.html'; // تأكدي من المسار
                }
            }
        } catch (error) {
            console.error(error);
            alert(error.message || 'Login failed');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}

// --- معالجة Signup ---
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = signupForm.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = 'Creating...';
        btn.disabled = true;

        // تجميع البيانات
        const accountType = document.querySelector('input[name="accountTypeRadio"]:checked').value;
        const baseData = {
            accountType: accountType,
            email: document.getElementById('signupEmail').value,
            password: document.getElementById('signupPassword').value,
            passwordConfirm: document.getElementById('passwordConfirm').value
        };

        let finalData = {};
        if (accountType === 'job_seeker') {
            finalData = {
                ...baseData,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value
            };
        } else {
            finalData = {
                ...baseData,
                firstName: document.getElementById('companyName').value, // الباك إند بيستخدم firstName كاسم للشركة أحياناً
                companyName: document.getElementById('companyName').value // أو ابعتيها كده لو الباك إند عدلها
            };
        }

        try {
            const data = await AuthService.signup(finalData);
            
            localStorage.setItem('tempEmail', finalData.email);
            alert('Account created! Please verify email.');
            window.location.href = '../auth/verify-email.html';

        } catch (error) {
            console.error(error);
            alert(error.message || 'Signup failed');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}