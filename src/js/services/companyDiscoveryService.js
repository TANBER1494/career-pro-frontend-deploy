import axiosClient from "../utils/axiosClient.js";

export const companyDiscoveryService = {
  // 1. Home Page: Random 6 Verified
  async getTopCompanies(params = {}) {
    // نطلب المسار الجديد /top
    const response = await axiosClient.get("/companies/top", { params });
    return response.data;
  },

  // 2. Companies Page: Get All (Search & Filter)
  async getAllCompanies(params = {}) {
    // نطلب المسار العام / (الذي ينفذ getAllCompanies في الباك)
    const response = await axiosClient.get("/companies", { params });
    return response.data;
  },

  // 3. Company Details
  async getCompanyDetails(id) {
    const response = await axiosClient.get(`/companies/${id}`);
    return response.data;
  },
};
