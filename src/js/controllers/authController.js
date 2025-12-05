import { authService } from "../services/authService.js";
import Swal from "sweetalert2";

// ... imports

// ==========================================
// Helper: Smart Redirect based on Step
// ==========================================
function handleLoginRedirect(user) {
  const { accountType, registrationStep } = user;

  // 1. Job Seeker Routing
  if (accountType === "job_seeker") {
    switch (registrationStep) {
      case 1:
        window.location.href =
          "/src/pages/seeker/seeker steps/ProfileStep1.html";
        break;
      case 2:
        window.location.href =
          "/src/pages/seeker/seeker steps/ProfileStep2.html";
        break;
      case 3:
        window.location.href =
          "/src/pages/seeker/seeker steps/ProfileStep3.html";
        break;
      default: // Step 4 or more (Completed)
        window.location.href = "/src/pages/seeker/dashboard.html"; // أو Home Page
        break;
    }
  }
  // 2. Company Routing
  else if (accountType === "company") {
    switch (registrationStep) {
      case 1:
        window.location.href =
          "/src/pages/company/company steps/CompanyStep1.html";
        break;
      case 2:
        window.location.href =
          "/src/pages/company/company steps/CompanyStep2.html";
        break;
      case 3:
        window.location.href =
          "/src/pages/company/company steps/CompanyStep3.html";
        break;
      default: // Step 4 or more (Completed)
        window.location.href =
          "/src/pages/company/company portal/dashboard.html";
        break;
    }
  }
}

// ==========================================
// Login Logic (Updated)
// ==========================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // UX: Loading Button
    const btn = loginForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Logging in...";
    btn.disabled = true;

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const result = await authService.login({ email, password });

      // Success
      Swal.fire({
        icon: "success",
        title: "Welcome Back!",
        text: "Logged in successfully.",
        timer: 1000,
        showConfirmButton: false,
      }).then(() => {
        // ✅ استخدام دالة التوجيه الذكي
        if (result.data && result.data.user) {
          handleLoginRedirect(result.data.user);
        }
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.message || "Invalid credentials",
      });
    } finally {
      // Reset Button
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}
// --- Signup Logic ---
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Get Account Type
    const accountType = document.querySelector(
      'input[name="accountTypeRadio"]:checked'
    ).value;

    // 2. Collect Data
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;

    let userData = { email, password, passwordConfirm, accountType };

    if (accountType === "job_seeker") {
      userData.firstName = document.getElementById("firstName").value;
      userData.lastName = document.getElementById("lastName").value;
    } else {
      userData.companyName = document.getElementById("companyName").value;
    }

    try {
      // 3. Call Backend
      await authService.signup(userData);

      // 4. Success -> Redirect to Verify Email
      localStorage.setItem("pendingVerificationEmail", email);

      Swal.fire({
        icon: "success",
        title: "Account Created!",
        text: "Please check your email for the verification code.",
        confirmButtonText: "Go to Verification",
      }).then(() => {
        // ✅ تصحيح المسار هنا (وهو سبب مشكلتك الحالية)
        window.location.href = "/src/pages/auth/verify-email.html";
      });
    } catch (error) {
      console.error("Signup Error Details:", error);

      const backendMessage = error.response?.data?.message;
      const displayMessage =
        backendMessage || "Something went wrong. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: displayMessage,
      });
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
            const data = await authService.verifyEmail({ email, verificationCode: code });

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