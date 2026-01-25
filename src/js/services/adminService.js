import axiosClient from "../utils/axiosClient.js";

export const adminService = {
  // 1. Get Dashboard Stats (إحصائيات)
  async getStats() {
    const response = await axiosClient.get("/admin/stats");
    return response.data;
  },

  // 2. Manage Users (إدارة المستخدمين)
  async getAllUsers(params = {}) {
    // params: { search, page, limit }
    const response = await axiosClient.get("/admin/users", { params });
    return response.data;
  },

  async deleteUser(userId) {
    const response = await axiosClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // 3. Manage Jobs (إدارة الوظائف)
  async getAllJobs(params = {}) {
    const response = await axiosClient.get("/admin/jobs", { params });
    return response.data;
  },

  async deleteJob(jobId) {
    const response = await axiosClient.delete(`/admin/jobs/${jobId}`);
    return response.data;
  },

  // 4. Verifications (التوثيق)
  async getVerificationRequests(status = "pending") {
    const response = await axiosClient.get("/admin/verification-requests", {
      params: { status },
    });
    return response.data;
  },

  async reviewCompany(documentId, status, rejectionReason = null) {
    const body = { status, rejectionReason };
    const response = await axiosClient.patch(
      `/admin/verify-company/${documentId}`,
      body
    );
    return response.data;
  },
};