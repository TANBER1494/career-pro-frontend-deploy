import axiosClient from "../utils/axiosClient.js";

export const seekerService = {
  // ============================================================
  // 1. Seeker Sign Up Steps & Profile
  // ============================================================

  // Step 1: Update Personal Information
  async updateProfileStep1(data) {
    // data: { phoneNumber, birthDate, gender, yearsOfExperience, ... }
    const response = await axiosClient.patch("/job-seeker/profile/step1", data);
    return response.data;
  },

  // Step 2: Update Education & Preferences
  async updateProfileStep2(data) {
    // data: { degree, university, graduationYear, jobType, ... }
    const response = await axiosClient.patch("/job-seeker/profile/step2", data);
    return response.data;
  },

  // Step 3: Upload CV
  async uploadCV(file) {
    // نستخدم FormData لأننا نرفع ملفاً
    const formData = new FormData();
    formData.append("cvFile", file); // "cvFile" هو الاسم المتفق عليه في الباك إند

    const response = await axiosClient.post(
      "/job-seeker/profile/step3",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // مهم جداً لرفع الملفات
        },
      }
    );
    return response.data;
  },

  // Get Complete Profile (Dashboard/Profile Page)
  async getProfile() {
    const response = await axiosClient.get("/job-seeker/profile");
    return response.data;
  },
};
