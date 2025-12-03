import axiosClient from "../utils/axiosClient.js";

export const companyDiscoveryService = {
  // ============================================================
  // Public Company Discovery (متاح للجميع)
  // ============================================================

  // 1. جلب الشركات المميزة (Top Companies) للصفحة الرئيسية
  async getTopCompanies() {
    const response = await axiosClient.get("/companies/top");
    return response.data;
  },

  // 2. جلب كل الشركات مع البحث والفلترة
  // filters: { search, industry, location, size, isVerified, page, limit }
  async getAllCompanies(filters = {}) {
    const response = await axiosClient.get("/companies", { params: filters });
    return response.data;
  },

  // 3. جلب التفاصيل العامة لشركة معينة (Public Profile + Jobs)
  // 3. جلب التفاصيل العامة لشركة معينة (Public Profile + Jobs)
  async getCompanyDetails(companyId) {
    // ✅ التصحيح: حذفنا /public لتتطابق مع الباك إند (/:id)
    const response = await axiosClient.get(`/companies/${companyId}`);
    return response.data;
  },
};
