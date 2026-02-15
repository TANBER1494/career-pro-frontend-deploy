import { authService } from '../services/authService.js';
import Swal from 'sweetalert2';

// ============================================================
// 1. Helper: Smart Redirect (التوجيه الذكي)
// ============================================================
function handleLoginRedirect(user) {
  const { accountType, registrationStep } = user;

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
      default:
        window.location.href = '/src/pages/seeker/profile/profile.html';
        break;
    }
  } else if (accountType === 'company') {
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
      default:
        window.location.href =
          '/src/pages/company/company portal/dashboard.html';
        break;
    }
  }
}

// ============================================================
// 2. Timer Logic (Exponential Backoff)
// ============================================================
const CooldownManager = {
  start(btn) {
    // 1. حساب وقت الانتظار (يتضاعف مع كل محاولة)
    let attempts = parseInt(localStorage.getItem('reset_attempts') || '0');
    let waitTime = 15 * Math.pow(2, attempts); // 15s, 30s, 60s...

    // سقف للانتظار (مثلاً لا يزيد عن 10 دقائق)
    if (waitTime > 600) waitTime = 600;

    const endTime = Date.now() + waitTime * 1000;

    // 2. الحفظ
    localStorage.setItem('reset_cooldown_end', endTime);
    localStorage.setItem('reset_attempts', attempts + 1);

    // 3. التشغيل
    this.run(btn, endTime);
  },

  check(btn) {
    const endTime = localStorage.getItem('reset_cooldown_end');
    // لو الوقت عدى أو مش موجود
    if (!endTime || Date.now() > parseInt(endTime)) {
      this.resetUI(btn);
      // لو عدى 24 ساعة من آخر محاولة، صفر العدادات
      const lastAttempt = localStorage.getItem('reset_cooldown_end');
      if (lastAttempt && Date.now() - parseInt(lastAttempt) > 86400000) {
        localStorage.setItem('reset_attempts', '0');
      }
      return;
    }
    // لو لسة فيه وقت
    this.run(btn, parseInt(endTime));
  },

  run(btn, endTime) {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');

    const timerInterval = setInterval(() => {
      const timeLeft = Math.ceil((endTime - Date.now()) / 1000);

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        this.resetUI(btn);
      } else {
        btn.innerHTML = `Wait ${timeLeft}s to resend`;
      }
    }, 1000);
  },

  resetUI(btn) {
    btn.disabled = false;
    btn.innerHTML = 'Send Reset Link';
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
  },
};

// ============================================================
// 3. Main Event Listener
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const forgotForm = document.getElementById('forgotForm');
  const resetForm = document.getElementById('resetForm');

  // ------------------------------------------------
  // A. Forgot Password Page Logic
  // ------------------------------------------------
  if (forgotForm) {
    const btn = document.getElementById('submitBtn');
    const emailInput = document.getElementById('email');

    // التحقق من المؤقت عند تحميل الصفحة
    CooldownManager.check(btn);

    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      if (!email) {
        Swal.fire('Warning', 'Please enter your email address.', 'warning');
        return;
      }

      try {
        // UI Loading
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        // API Call
        await authService.forgotPassword(email);

        // Success
        Swal.fire({
          icon: 'success',
          title: 'Email Sent!',
          text: 'Check your inbox for the reset link.',
          confirmButtonColor: '#3b82f6',
        });

        // تشغيل المؤقت الذكي
        CooldownManager.start(btn);
      } catch (error) {
        console.error(error);
        if (error.response?.status === 429) {
          Swal.fire({
            icon: 'warning',
            title: 'Too Many Requests',
            text:
              error.response.data.message || 'Please wait before trying again.',
          });
          // لو السيرفر هو اللي رفض، نشغل المؤقت بردو احتياطي
          CooldownManager.start(btn);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || 'Failed to send reset link.',
            confirmButtonColor: '#ef4444',
          });
          CooldownManager.resetUI(btn);
        }
      }
    });
  }

  // ------------------------------------------------
  // B. Reset Password Page Logic
  // ------------------------------------------------
  if (resetForm) {
    // التأكد من وجود التوكن في الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Link',
        text: 'Reset token is missing.',
        allowOutsideClick: false,
        confirmButtonText: 'Go to Login',
      }).then(() => {
        window.location.href = 'signup-login.html';
      });
    }

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;
      const btn = document.getElementById('submitBtn');

      if (password.length < 8) {
        Swal.fire(
          'Warning',
          'Password must be at least 8 characters.',
          'warning'
        );
        return;
      }
      if (password !== passwordConfirm) {
        Swal.fire('Warning', 'Passwords do not match.', 'warning');
        return;
      }

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

        const response = await authService.resetPassword(
          token,
          password,
          passwordConfirm
        );

        // حفظ البيانات الجديدة للدخول المباشر
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        await Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          text: 'You have been logged in automatically.',
          timer: 2000,
          showConfirmButton: false,
        });

        // التوجيه الذكي
        if (response.data && response.data.user) {
          handleLoginRedirect(response.data.user);
        } else {
          window.location.href = '../../../../index.html';
        }
      } catch (error) {
        console.error(error);
        const errorMsg =
          error.response?.data?.message || 'Token is invalid or expired.';
        Swal.fire({
          icon: 'error',
          title: 'Reset Failed',
          text: errorMsg,
          confirmButtonColor: '#ef4444',
        });
        btn.disabled = false;
        btn.innerHTML = 'Reset Password';
      }
    });
  }
});
