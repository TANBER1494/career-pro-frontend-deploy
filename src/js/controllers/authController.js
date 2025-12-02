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
