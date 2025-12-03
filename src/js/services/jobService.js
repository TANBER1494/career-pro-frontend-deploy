import axiosClient from "../utils/axiosClient.js";

export const jobService = {
  // ============================================================
  // 1. Public Jobs (تصفح الوظائف - متاح للجميع)
  // ============================================================

  // جلب الوظائف المميزة (للصفحة الرئيسية)
  async getFeaturedJobs() {
    const response = await axiosClient.get("/jobs/featured");
    return response.data;
  },

  // جلب كل الوظائف مع البحث والفلترة
  // filters object example: { search: 'React', type: 'Full-time', location: 'Cairo', page: 1 }
  async getAllJobs(filters = {}) {
    // تحويل الفلاتر إلى query parameters string
    // axios بيعمل ده تلقائي لو بعتنا params، بس دي طريقة صريحة
    const response = await axiosClient.get("/jobs", { params: filters });
    return response.data;
  },

  // جلب تفاصيل وظيفة معينة
  async getJobDetails(jobId) {
    const response = await axiosClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  // ============================================================
  // 2. Protected Actions (إجراءات تتطلب تسجيل دخول)
  // ============================================================

  // التقديم على وظيفة (رفع CV + Cover Letter)
  async applyForJob(jobId, applyData) {
    // applyData expected: { cvFile: File, coverLetter: string, fullName: string, ... }

    const formData = new FormData();
    // نرفع البيانات المطلوبة حسب الـ API Contract
    formData.append("cvFile", applyData.cvFile);
    formData.append("fullName", applyData.fullName);
    formData.append("email", applyData.email);
    formData.append("phone", applyData.phone);

    if (applyData.coverLetter) {
      formData.append("coverLetter", applyData.coverLetter);
    }

    const response = await axiosClient.post(`/jobs/${jobId}/apply`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // حفظ / إلغاء حفظ وظيفة (Toggle Save)
  async toggleSaveJob(jobId) {
    // الـ API بيرجع { isSaved: true/false }
    const response = await axiosClient.post(`/jobs/${jobId}/save`);
    return response.data;
  },

  // عرض تاريخ تقديماتي (My Applications)
  async getMyApplications() {
    const response = await axiosClient.get("/job-seeker/applications");
    return response.data;
  },
};
