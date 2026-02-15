import { authService } from '../services/authService.js';
import Swal from 'sweetalert2';

// ==========================================
// Helper: Smart Redirect based on Step
// ==========================================
function handleLoginRedirect(user) {
  const { accountType, registrationStep } = user;

  // 1. Job Seeker Routing
  if (accountType === 'job_seeker') {
    switch (registrationStep) {
      case 1:
        window.location.href =
          '/src/pages/seeker/seeker steps/ProfileStep1.html';
        break;
      case 2:
        window.location.href =
          '/src/pages/seeker/seeker steps/ProfileStep2.html';
        break;
      case 3:
        window.location.href =
          '/src/pages/seeker/seeker steps/ProfileStep3.html';
        break;
      default: // Step 4 (Completed)
        window.location.href = '/src/pages/seeker/profile/profile.html';
        break;
    }
  }
  // 2. Company Routing
  else if (accountType === 'company') {
    switch (registrationStep) {
      case 1:
        window.location.href =
          '/src/pages/company/company steps/CompanyStep1.html';
        break;
      case 2:
        window.location.href =
          '/src/pages/company/company steps/CompanyStep2.html';
        break;
      case 3:
        window.location.href =
          '/src/pages/company/company steps/CompanyStep3.html';
        break;
      default: // Step 4 (Completed)
        window.location.href =
          '/src/pages/company/company portal/dashboard.html';
        break;
    }
  } else if (accountType === 'admin') {
    window.location.href = '/src/pages/admin/dashboard.html';
  }
}

// ==========================================
// 1. Login Logic
// ==========================================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = loginForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    // 👇👇 التصحيح هنا: تأكدنا إننا بناخد القيمة النصية مش العنصر
    const emailInput = document.getElementById('email');
    const emailVal = emailInput.value.trim(); // خدنا النص وشيلنا المسافات الزيادة
    const passwordVal = document.getElementById('password').value;

    try {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      btn.disabled = true;

      // بنبعت النص الصريح
      const result = await authService.login({
        email: emailVal,
        password: passwordVal,
      });

      Swal.fire({
        icon: 'success',
        title: 'Welcome Back!',
        timer: 1000,
        showConfirmButton: false,
      }).then(() => {
        if (result.data && result.data.user) {
          handleLoginRedirect(result.data.user);
        }
      });
    } catch (error) {
      console.error(error);

      // 🔥 معالجة الحساب غير المفعل (403)
      if (error.response && error.response.status === 403) {
        // 👇👇 هنا بنخزن "النص" (emailVal) اللي جبناه فوق صح
        localStorage.setItem('tempEmail', emailVal);

        Swal.fire({
          icon: 'info',
          title: 'Verification Required',
          text: 'Your account is created but not verified. Redirecting...',
          timer: 2500,
          showConfirmButton: false,
          allowOutsideClick: false,
        }).then(() => {
          window.location.href = '/src/pages/auth/verify-email.html';
        });
        return;
      }

      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || 'Invalid credentials',
      });
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}

// ==========================================
// 2. Signup Logic (Updated for Email Verification)
// ==========================================
const signupForm = document.getElementById('signupForm');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = signupForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    try {
      // 1. Get Values
      const accountType = document.querySelector(
        'input[name="accountTypeRadio"]:checked'
      ).value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;

      let userData = { email, password, passwordConfirm, accountType };

      if (accountType === 'job_seeker') {
        userData.firstName = document.getElementById('firstName').value;
        userData.lastName = document.getElementById('lastName').value;
      } else {
        userData.companyName = document.getElementById('companyName').value;
      }

      // UX: Loading
      btn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
      btn.disabled = true;

      // 2. Call Backend
      await authService.signup(userData);

      // 3. Success Handling
      // ✅ تصحيح هام: توحيد اسم المفتاح ليكون tempEmail
      localStorage.setItem('tempEmail', email);

      Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        text: 'A verification code has been sent to your email.',
        confirmButtonText: 'Verify Now',
        allowOutsideClick: false,
      }).then(() => {
        // التوجيه لصفحة التفعيل
        window.location.href = '/src/pages/auth/verify-email.html';
      });
    } catch (error) {
      console.error('Signup Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Signup Failed',
        text: error.response?.data?.message || 'Something went wrong.',
      });
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}
// ==========================================
// 4. Verify Email Logic (Complete)
// ==========================================
const verifyForm = document.getElementById('verifyForm');

if (verifyForm) {
  // أ) منطق زر التأكيد (Verify)
  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. قراءة الكود من الحقل المخفي (اللي الـ JS بتاع الـ HTML ملاه)
    const code = document.getElementById('verificationCode').value;
    const email = localStorage.getItem('tempEmail');

    if (!email) {
      alert('No email found. Please signup again.');
      window.location.href = '../../pages/auth/signup-login.html';
      return;
    }

    // UX: تغيير نص الزرار أثناء التحميل
    const btn = verifyForm.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = 'Verifying...';
    btn.disabled = true;

    try {
      // 2. الاتصال بالسيرفر
      const data = await authService.verifyEmail({
        email,
        verificationCode: code,
      });

      // 3. التعامل مع النجاح
      if (data.token) localStorage.setItem('authToken', data.token);

      if (data.data && data.data.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));

        alert('Email Verified Successfully!');

        // 4. التوجيه الذكي
        if (data.data.user.accountType === 'company') {
          window.location.href = '../company/company steps/CompanyStep1.html';
        } else {
          window.location.href = '../seeker/seeker steps/ProfileStep1.html';
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.message || 'Verification failed');
      // إرجاع الزر لحالته الأصلية عند الفشل
      btn.innerText = originalText;
      btn.disabled = false;
    }
  });

  // ب) منطق زر إعادة الإرسال (Resend Code)
  const resendBtn = document.getElementById('resendBtn');
  const resendMessage = document.getElementById('resendMessage'); // تأكدي إن العنصر ده موجود في HTML

  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const email = localStorage.getItem('tempEmail');
      if (!email) return;

      // تعطيل الزر وتشغيل العداد (UX)
      resendBtn.disabled = true;
      resendBtn.style.color = '#999';
      resendBtn.style.cursor = 'not-allowed';

      let countdown = 60;
      const timer = setInterval(() => {
        resendBtn.innerText = `Resend in ${countdown}s`;
        countdown--;
        if (countdown < 0) {
          clearInterval(timer);
          resendBtn.disabled = false;
          resendBtn.innerText = 'Resend Code';
          resendBtn.style.color = '';
          resendBtn.style.cursor = 'pointer';
        }
      }, 1000);

      try {
        await authService.resendCode(email);
        alert('Code sent successfully! Check your inbox.');
      } catch (error) {
        clearInterval(timer);
        resendBtn.disabled = false;
        resendBtn.innerText = 'Resend Code';
        alert(error.message || 'Failed to resend code');
      }
    });
  }
}
