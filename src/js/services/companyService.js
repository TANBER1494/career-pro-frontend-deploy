import axiosClient from "../utils/axiosClient.js";

export const companyService = {
  // ============================================================
  // 1. Company Sign Up Steps & Profile Management
  // ============================================================

  // Step 1: Update Basic Info (Location, Industry, Size, etc.)
  // data: { location, industry, foundedYear, numberOfEmployees, phone, website, companyDescription }
  async updateProfileStep1(data) {
    const response = await axiosClient.patch("/companies/profile/step1", data);
    return response.data;
  },

  // Step 2: Update Details (Tech Stack, Benefits, Social Media)
  // data: { technologies: [], benefits: [], socialMedia: { linkedin, ... } }
  async updateProfileStep2(data) {
    const response = await axiosClient.patch("/companies/profile/step2", data);
    return response.data;
  },

  // Step 3: Upload Verification Document
  async uploadVerificationDoc(file) {
    const formData = new FormData();
    // "verificationDocument" هو الاسم المتفق عليه في الباك إند (Multer)
    formData.append("verificationDocument", file);

    const response = await axiosClient.post(
      "/companies/profile/step3",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Upload Company Logo
  async uploadLogo(file) {
    const formData = new FormData();
    formData.append("logoFile", file); // "logoFile" هو الاسم في الباك إند

    const response = await axiosClient.post(
      "/companies/profile/logo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Get Full Company Profile
  async getProfile() {
    const response = await axiosClient.get("/companies/profile");
    return response.data;
  },
};
