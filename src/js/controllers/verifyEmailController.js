import { authService } from "../services/authService.js";
import Swal from "sweetalert2"; // تأكد أن المكتبة متاحة

const verifyForm = document.getElementById("verifyForm");
const resendBtn = document.getElementById("resendBtn");

// ==========================================
// 1. Verify Logic (زر التأكيد)
// ==========================================
if (verifyForm) {
  verifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // جلب الكود من الحقل المخفي (الذي يجمعه كود الـ OTP)
    const code = document.getElementById("verificationCode").value;

    // جلب الإيميل من الذاكرة (سواء من تسجيل جديد أو لوجن سابق)
    const email =
      localStorage.getItem("pendingVerificationEmail") ||
      localStorage.getItem("tempEmail");

    if (!email) {
      Swal.fire({
        icon: "error",
        title: "Email Not Found",
        text: "Please signup or login again.",
      }).then(() => {
        window.location.href = "/src/pages/auth/signup-login.html";
      });
      return;
    }

    if (!code || code.length < 6) {
      Swal.fire("Error", "Please enter the full 6-digit code.", "warning");
      return;
    }

    // UX: Loading State
    const btn = verifyForm.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Verifying...";
    btn.disabled = true;

    try {
      // Call Backend
      const data = await authService.verifyEmail({
        email,
        verificationCode: code,
      });

      // Success Handling
      if (data.token) {
        localStorage.setItem("token", data.token); // Save Token (Important!)
      }
      if (data.data && data.data.user) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      // Clean up temporary email
      localStorage.removeItem("pendingVerificationEmail");
      localStorage.removeItem("tempEmail");

      Swal.fire({
        icon: "success",
        title: "Verified!",
        text: "Your email has been successfully verified.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        // Redirect based on Account Type
        const user = data.data.user;
        if (user.accountType === "company") {
          // استخدم المسار الكامل لتجنب الأخطاء
          window.location.href =
            "/src/pages/company/company steps/CompanyStep1.html";
        } else {
          window.location.href =
            "/src/pages/seeker/seeker steps/ProfileStep1.html";
        }
      });
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message || "Verification failed. Invalid code.";
      Swal.fire("Error", message, "error");
    } finally {
      // Reset Button
      btn.innerText = originalText;
      btn.disabled = false;
    }
  });
}

// ==========================================
// 2. Resend Code Logic (زر إعادة الإرسال)
// ==========================================
if (resendBtn) {
  resendBtn.addEventListener("click", async () => {
    const email =
      localStorage.getItem("pendingVerificationEmail") ||
      localStorage.getItem("tempEmail");

    if (!email) {
      Swal.fire("Error", "No email found to resend code to.", "error");
      return;
    }

    // Disable Button & Start Timer
    resendBtn.disabled = true;
    resendBtn.style.color = "#999";
    resendBtn.style.cursor = "not-allowed";

    let countdown = 60;
    const timer = setInterval(() => {
      resendBtn.innerText = `Resend in ${countdown}s`;
      countdown--;
      if (countdown < 0) {
        clearInterval(timer);
        resendBtn.disabled = false;
        resendBtn.innerText = "Resend Code";
        resendBtn.style.color = "";
        resendBtn.style.cursor = "pointer";
      }
    }, 1000);

    try {
      await authService.resendCode(email);
      Swal.fire({
        icon: "success",
        title: "Code Sent",
        text: "A new verification code has been sent to your email.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (error) {
      clearInterval(timer);
      resendBtn.disabled = false;
      resendBtn.innerText = "Resend Code";

      const message = error.response?.data?.message || "Failed to resend code";
      Swal.fire("Error", message, "error");
    }
  });
}
