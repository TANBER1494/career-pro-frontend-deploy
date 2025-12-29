import { authService } from "../services/authService.js";
import Swal from "sweetalert2";

document.addEventListener("DOMContentLoaded", () => {
  const forgotForm = document.getElementById("forgotForm");
  const resetForm = document.getElementById("resetForm");

  // ============================================================
  // 1. Logic for Forgot Password Page (With Exponential Timer)
  // ============================================================
  if (forgotForm) {
    const btn = document.getElementById("submitBtn");
    const emailInput = document.getElementById("email");

    // أرقام الثوابت
    const BASE_WAIT_TIME = 15; // يبدأ بـ 15 ثانية

    // 1. عند تحميل الصفحة: تحقق هل يوجد مؤقت مخزن؟
    checkAndStartTimer(btn);

    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      if (!email) {
        Swal.fire("Warning", "Please enter your email address.", "warning");
        return;
      }

      try {
        // UI Loading
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        // Call API
        await authService.forgotPassword(email);

        // Success Alert
        Swal.fire({
          icon: "success",
          title: "Email Sent!",
          text: "Check your inbox for the link.",
          confirmButtonColor: "#3b82f6",
        });

        emailInput.value = "";

        // 🔥 تشغيل المؤقت التصاعدي (Exponential Backoff)
        startExponentialTimer(btn);
      } catch (error) {
        console.error(error);

        // لو الخطأ من الباك إند إنه لازم يستنى (429)
        if (error.response?.status === 429) {
          Swal.fire({
            icon: "warning",
            title: "Wait a moment",
            text: error.response.data.message,
          });
          // ممكن هنا نشغل تايمر ثابت لو حابب، بس التايمر الفرونت كافي
        } else {
          const errorMsg =
            error.response?.data?.message || "Failed to send reset link.";
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMsg,
            confirmButtonColor: "#ef4444",
          });

          // في حالة الخطأ العادي، نرجع الزرار شغال
          btn.disabled = false;
          btn.innerHTML = "Send Reset Link";
        }
      }
    });
  }

  // ============================================================
  // 2. Logic for Reset Password Page (كما هو)
  // ============================================================
  if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Invalid Link",
          text: "Missing token.",
        });
        return;
      }

      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("passwordConfirm").value;
      const btn = document.getElementById("submitBtn");

      if (password.length < 8) {
        Swal.fire(
          "Warning",
          "Password must be at least 8 characters.",
          "warning"
        );
        return;
      }
      if (password !== passwordConfirm) {
        Swal.fire("Warning", "Passwords do not match.", "warning");
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

        if (response.token) {
          localStorage.setItem("token", response.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Password changed successfully. You are now logged in.",
          confirmButtonColor: "#16a34a",
          timer: 2000,
          showConfirmButton: false,
        });

        // Redirect based on status
        const user = response.data.user;
        if (user.registrationStep < 2) {
          if (user.accountType === "company")
            window.location.href =
              "/src/pages/auth/complete-company-profile.html";
          else window.location.href = "/src/pages/auth/complete-profile.html";
        } else {
          if (user.accountType === "company")
            window.location.href = "/src/pages/company/dashboard.html";
          else window.location.href = "../../../../index.html";
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || "Token invalid.";
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMsg,
          confirmButtonColor: "#ef4444",
        });
      } finally {
        btn.disabled = false;
        btn.innerHTML = "Reset Password";
      }
    });
  }
});

// ============================================================
// 🔥 HELPER FUNCTIONS: Exponential Timer Logic
// ============================================================

function startExponentialTimer(btn) {
  // 1. جلب عدد المحاولات السابقة
  let attempts = parseInt(localStorage.getItem("reset_attempts") || "0");

  // 2. حساب وقت الانتظار: 15 * (2 أس عدد المحاولات)
  // المرة 0: 15 ثانية
  // المرة 1: 30 ثانية
  // المرة 2: 60 ثانية ...
  let waitTime = 15 * Math.pow(2, attempts);

  // 3. تحديد وقت الانتهاء (الوقت الحالي + وقت الانتظار بالميلي ثانية)
  const endTime = Date.now() + waitTime * 1000;

  // 4. الحفظ في LocalStorage
  localStorage.setItem("reset_cooldown_end", endTime);
  localStorage.setItem("reset_attempts", attempts + 1); // زود المحاولات للمرة الجاية

  // 5. تشغيل العداد
  runTimer(btn, endTime);
}

function checkAndStartTimer(btn) {
  const endTime = localStorage.getItem("reset_cooldown_end");

  // لو مفيش وقت مخزن، أو الوقت المخزن خلاص عدى
  if (!endTime || Date.now() > parseInt(endTime)) {
    btn.disabled = false;
    btn.innerHTML = "Send Reset Link";
    return;
  }

  // لو لسة فيه وقت، شغل العداد
  runTimer(btn, parseInt(endTime));
}

function runTimer(btn, endTime) {
  // تحديث فوري عشان ميبانش انه شغال للحظة
  btn.disabled = true;

  const update = () => {
    const now = Date.now();
    const timeLeft = Math.ceil((endTime - now) / 1000);

    if (timeLeft <= 0) {
      // انتهى الوقت
      clearInterval(timerInterval);
      btn.disabled = false;
      btn.innerHTML = "Send Reset Link";
      btn.classList.remove("bg-gray-400", "cursor-not-allowed"); // تنسيق اختياري
      localStorage.removeItem("reset_cooldown_end"); // امسح وقت الانتهاء بس سيب عدد المحاولات عشان المضاعفة تفضل شغالة
    } else {
      // لسة شغال
      btn.innerHTML = `Wait ${timeLeft}s to resend`;
      btn.classList.add("bg-gray-400", "cursor-not-allowed");
    }
  };

  update(); // تشغيل مرة فوراً
  const timerInterval = setInterval(update, 1000);
}
