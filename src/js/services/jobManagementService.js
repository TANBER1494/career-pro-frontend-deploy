import axiosClient from "../utils/axiosClient.js";

export const jobManagementService = {
  // ============================================================
  // 1. Dashboard & Stats
  // ============================================================

  // جلب إحصائيات الشركة (لصفحة الداشبورد)
  async getCompanyStats() {
    // ملاحظة: المسار هنا يتبع companies (جمع) كما صححنا سابقاً في الباك إند
    const response = await axiosClient.get("/companies/dashboard");
    return response.data;
  },

  // ============================================================
  // 2. Job CRUD Operations (إدارة الوظائف)
  // ============================================================

  // نشر وظيفة جديدة
  async createJob(jobData) {
    // jobData: { title, description, skills: [], ... }
    const response = await axiosClient.post("/jobs", jobData);
    return response.data;
  },

  // جلب وظائف الشركة الخاصة (My Jobs List)
  // filters: { status: 'active' | 'closed' | 'draft', page, limit }
  async getMyJobs(filters = {}) {
    const response = await axiosClient.get("/jobs/my-jobs", {
      params: filters,
    });
    return response.data;
  },

  // تعديل تفاصيل وظيفة
  async editJob(jobId, updateData) {
    const response = await axiosClient.patch(`/jobs/${jobId}`, updateData);
    return response.data;
  },

  // تغيير حالة الوظيفة (إيقاف / نشر / إغلاق)
  async updateJobStatus(jobId, status) {
    // status values: 'Active', 'Closed', 'Draft', 'Paused'
    const response = await axiosClient.patch(`/jobs/${jobId}/status`, {
      status,
    });
    return response.data;
  },

  // حذف وظيفة نهائياً
  async deleteJob(jobId) {
    const response = await axiosClient.delete(`/jobs/${jobId}`);
    return response.data; // Returns 204 No Content usually
  },
};
