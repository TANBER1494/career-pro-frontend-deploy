import axiosClient from "../utils/axiosClient.js";

export const authService = {
  // 1. تسجيل حساب جديد
  async signup(userData) {
    // userData: { firstName, lastName, email, password, passwordConfirm, accountType }
    const response = await axiosClient.post("/auth/signup", userData);
    return response.data;
  },

  // 2. تفعيل الإيميل
  async verifyEmail(data) {
    // data: { email, verificationCode }
    const response = await axiosClient.post("/auth/verify-email", data);
    return response.data;
  },

  // 3. تسجيل الدخول
  async login(credentials) {
    // credentials: { email, password }
    const response = await axiosClient.post("/auth/login", credentials);

    // لو نجح، نحفظ التوكن واليوزر
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  // 4. الخروج
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // توجيه لصفحة تسجيل الدخول
    window.location.href = "/login";
  },

  // 5. جلب بيانات المستخدم الحالي
  async getMe() {
    const response = await axiosClient.get("/auth/me");
    return response.data;
  },

  async resendCode(email) {
    const response = await axiosClient.post("/auth/resend-code", { email });
    return response.data;
  },

  // ============================================================
  // (Password Reset)
  // ============================================================

  // 7. طلب رابط استعادة كلمة المرور (Forgot Password)
  async forgotPassword(email) {
    // نرسل الإيميل للباك إند
    const response = await axiosClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  // 8. تعيين كلمة المرور الجديدة (Reset Password)
  async resetPassword(token, password, passwordConfirm) {
    // نرسل التوكن في الرابط، والباسورد الجديد في الجسم (Body)
    const response = await axiosClient.patch(`/auth/reset-password/${token}`, {
      password,
      passwordConfirm,
    });
    return response.data;
  },
};
