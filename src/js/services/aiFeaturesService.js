import axiosClient from '../utils/axiosClient.js';

export const aiFeaturesService = {
  // ============================================================
  // 1. Personality Test (MBTI)
  // ============================================================

  async getPersonalityQuestions() {
    const response = await axiosClient.get('/personality/questions');
    return response.data;
  },

  async submitPersonalityTest(answersArray) {
    const response = await axiosClient.post('/personality/submit', {
      answers: answersArray,
    });
    return response.data;
  },

  async getExistingResult() {
    const response = await axiosClient.get('/personality/result');
    return response.data;
  },

  // ============================================================
  // 🚀 2. CV Analyzer & ATS Checker
  // ============================================================

  async analyzeCV(cvFile, jobDescription) {
    const formData = new FormData();
    formData.append('cvFile', cvFile);
    formData.append('jobDescription', jobDescription);

    // 🚨 التعديل هنا: إجبار Axios على إرسال البيانات كـ (ملفات) وليس JSON
    const response = await axiosClient.post('/ai/analyze-cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getExistingCVResult() {
    const response = await axiosClient.get('/ai/analyze-cv/latest');
    return response.data;
  },

  // ============================================================
  // 🚀 3. AI Job Matching Engine
  // ============================================================

  // 🚨 التعديل الجديد: استقبال متغير isForceRefresh لتحديد نوع الطلب
  async getJobMatches(isForceRefresh = false) {
    // بناء المسار (Endpoint) بناءً على طلب التحديث
    const endpoint = isForceRefresh 
      ? '/job-seeker/ai-matches?refresh=true' 
      : '/job-seeker/ai-matches';

    // 🚨 اللمسة المعمارية: إجبار Axios على الانتظار 45 ثانية لأن الـ AI يحتاج وقتاً للتفكير
    const response = await axiosClient.get(endpoint, {
      timeout: 45000, // 45 seconds
    });

    return response.data;
  },
};