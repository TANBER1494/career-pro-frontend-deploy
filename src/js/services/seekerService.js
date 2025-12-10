import axiosClient from "../utils/axiosClient.js";

export const seekerService = {
  // 1. Get Profile
  async getMe() {
    const response = await axiosClient.get("/job-seeker/profile");
    return response.data;
  },

  // 2. Update Profile
  async updateProfile(data) {
    const req1 = axiosClient.patch("/job-seeker/profile/step1", data);
    const req2 = axiosClient.patch("/job-seeker/profile/step2", data);
    const [res1] = await Promise.all([req1, req2]);
    return res1.data;
  },

  // 3. Helper Steps
  async updateProfileStep1(data) {
    const response = await axiosClient.patch("/job-seeker/profile/step1", data);
    return response.data;
  },

  async updateProfileStep2(data) {
    const response = await axiosClient.patch("/job-seeker/profile/step2", data);
    return response.data;
  },

  // ✅ التعديل هنا في هذه الدالة
  async uploadCV(file) {
    const formData = new FormData();

    // 🔴 القديم (الخاطئ): formData.append("cv", file);
    // 🟢 الجديد (الصحيح): يجب أن يطابق ما ينتظره الباك إند (Multer)
    formData.append("cvFile", file);

    const response = await axiosClient.post(
      "/job-seeker/profile/step3",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  // 4. Get My Applications
  async getMyApplications() {
    const response = await axiosClient.get("/job-seeker/applications");
    return response.data;
  },
};
