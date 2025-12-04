import { authService } from "../services/authService.js";
import Swal from "sweetalert2"; // (تأكدوا من تثبيتها أو استخدام CDN)

// --- Login Logic ---
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const result = await authService.login({ email, password });

      // Success
      Swal.fire({
        icon: "success",
        title: "Welcome Back!",
        text: "Logged in successfully.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        // Redirect based on account type
        if (result.data.user.accountType === "company") {
          window.location.href = "/pages/company/dashboard.html";
        } else {
          window.location.href = "/pages/seeker/dashboard.html";
        }
      });
    } catch (error) {
      console.error("Signup Error Details:", error); // للمطور فقط في الكونسول

      // ✅ الذكاء هنا: استخراج الرسالة من رد الباك إند
      // error.response.data.message هو المكان الذي يضع فيه الباك إند رسالته
      const backendMessage = error.response?.data?.message;

      // لو مفيش رسالة من الباك، نعرض رسالة عامة
      const displayMessage =
        backendMessage || "Something went wrong. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: displayMessage, // عرض الرسالة النظيفة للمستخدم
      });
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
      // Store email to use it in the verification page
      localStorage.setItem("pendingVerificationEmail", email);

      Swal.fire({
        icon: "success",
        title: "Account Created!",
        text: "Please check your email for the verification code.",
        confirmButtonText: "Go to Verification",
      }).then(() => {
        window.location.href = "/pages/auth/verify-email.html";
      });
    } catch (error) {
      console.error("Signup Error Details:", error); // للمطور فقط في الكونسول

      // ✅ الذكاء هنا: استخراج الرسالة من رد الباك إند
      // error.response.data.message هو المكان الذي يضع فيه الباك إند رسالته
      const backendMessage = error.response?.data?.message;

      // لو مفيش رسالة من الباك، نعرض رسالة عامة
      const displayMessage =
        backendMessage || "Something went wrong. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: displayMessage, // عرض الرسالة النظيفة للمستخدم
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