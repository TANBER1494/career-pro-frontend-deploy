import axiosClient from "../utils/axiosClient.js";

export const adminService = {
  // ============================================================
  // Admin Portal Actions (للأدمن فقط)
  // ============================================================

  // 1. جلب طلبات التوثيق المعلقة
  // filters: { status: 'pending' | 'approved' | 'rejected', page, limit }
  async getVerificationRequests(filters = {}) {
    // الرابط: /admin/verification-requests
    const response = await axiosClient.get("/admin/verification-requests", {
      params: filters,
    });
    return response.data;
  },

  // 2. مراجعة طلب توثيق (قبول / رفض)
  // data: { status: 'approved' | 'rejected', rejectionReason?: string }
  async reviewVerification(documentId, data) {
    // الرابط: /admin/verify-company/:documentId
    const response = await axiosClient.patch(
      `/admin/verify-company/${documentId}`,
      data
    );
    return response.data;
  },
};
