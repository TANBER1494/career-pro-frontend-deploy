import axiosClient from "../utils/axiosClient.js";

export const applicationService = {
  // ============================================================
  // Company Applications Management (للشركات فقط)
  // ============================================================

  // 1. جلب طلبات المتقدمين (مع الفلترة)
  // filters: { page, limit, jobId, status, search }
  async getCompanyApplications(filters = {}) {
    // الرابط: /companies/applications (حسب آخر تحديث في companyRoutes.js)
    // في companyRoutes.js كان المسار: router.get("/applications", ...) تحت /api/v1/companies
    const response = await axiosClient.get("/companies/applications", {
      params: filters,
    });
    return response.data;
  },

  // 2. تحديث حالة الطلب (نقل المرشح لمرحلة جديدة)
  async updateApplicationStatus(applicationId, status) {
    // status: 'Reviewing', 'Interviewed', 'Hired', 'Rejected'
    // الرابط: /applications/:id/status (حسب applicationRoutes.js)
    const response = await axiosClient.patch(
      `/applications/${applicationId}/status`,
      { status }
    );
    return response.data;
  },
};
