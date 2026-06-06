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

  async getJobMatches() {
    // 🚨 اللمسة المعمارية: إجبار Axios على الانتظار 45 ثانية لأن الـ AI يحتاج وقتاً للتفكير
    // الـ Endpoint يجب أن يطابق مسار الباك إند الخاص بطلبة العمل
    const response = await axiosClient.get('/job-seeker/ai-matches', {
      timeout: 45000, // 45 seconds
    });

    return response.data;
  },
};
