import { authService } from '../services/authService.js';
import Swal from 'sweetalert2';

const verifyForm = document.getElementById('verifyForm');
const resendBtn = document.getElementById('resendBtn');

// ==========================================
// 1. Verify Logic (زر التأكيد)
// ==========================================
if (verifyForm) {
  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. تعريف عناصر الـ UI في البداية (لتفادي مشاكل الـ Scope)
    const btn = verifyForm.querySelector('button[type="submit"]');
    const originalText = btn.innerText;

    // جلب الكود من الحقل المخفي
    const code = document.getElementById('verificationCode').value;

    // جلب الإيميل
    const email =
      localStorage.getItem('pendingVerificationEmail') ||
      localStorage.getItem('tempEmail');

    // التحقق من وجود الإيميل
    if (!email) {
      Swal.fire({
        icon: 'error',
        title: 'Email Not Found',
        text: 'Please signup or login again.',
        confirmButtonColor: '#3b82f6',
      }).then(() => {
        window.location.href = '/src/pages/auth/signup-login.html';
      });
      return;
    }

    // التحقق من الكود
    if (!code || code.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Code',
        text: 'Please enter the full 6-digit code.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    try {
      // UX: Loading State
      btn.innerText = 'Verifying...';
      btn.disabled = true;
      btn.classList.add('opacity-70', 'cursor-not-allowed'); // إضافة ستايل للتعطيل

      // Call Backend
      const data = await authService.verifyEmail({
        email,
        verificationCode: code,
      });

      // Success Handling
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.data && data.data.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      // Clean up temporary email
      localStorage.removeItem('pendingVerificationEmail');
      localStorage.removeItem('tempEmail');

      Swal.fire({
        icon: 'success',
        title: 'Verified!',
        text: 'Your email has been successfully verified.',
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        const user = data.data.user;
        // التوجيه بناءً على نوع الحساب
        if (user.accountType === 'company') {
          window.location.href =
            '/src/pages/company/company steps/CompanyStep1.html';
        } else {
          window.location.href =
            '/src/pages/seeker/seeker steps/ProfileStep1.html';
        }
      });
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message || 'Verification failed. Invalid code.';
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: message,
        confirmButtonColor: '#d33',
      });
    } finally {
      // Reset Button (دائماً سيعمل الآن لأن btn معرف خارج الـ try)
      btn.innerText = originalText;
      btn.disabled = false;
      btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
  });
}

// ==========================================
// 2. Resend Code Logic (زر إعادة الإرسال)
// ==========================================
if (resendBtn) {
  resendBtn.addEventListener('click', async () => {
    const email =
      localStorage.getItem('pendingVerificationEmail') ||
      localStorage.getItem('tempEmail');

    if (!email) {
      Swal.fire('Error', 'No email found to resend code to.', 'error');
      return;
    }

    // Disable Button & Start Timer
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
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: 'success',
        title: 'New code sent successfully',
      });
    } catch (error) {
      clearInterval(timer);
      resendBtn.disabled = false;
      resendBtn.innerText = 'Resend Code';
      resendBtn.style.color = '';
      resendBtn.style.cursor = 'pointer';

      const message = error.response?.data?.message || 'Failed to resend code';
      Swal.fire('Error', message, 'error');
    }
  });
}
