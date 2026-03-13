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
    // 1. بناء كائن FormData لأننا نتعامل مع رفع ملفات
    const formData = new FormData();
    
    // 2. إضافة البيانات بنفس المفاتيح (Keys) التي ينتظرها الباك إند
    formData.append('cvFile', cvFile); // هذا ما ينتظره upload.single('cvFile')
    formData.append('jobDescription', jobDescription); // هذا ما ينتظره req.body.jobDescription

    // 3. إرسال الطلب
    // (ملاحظة: Axios ذكي جداً، عندما يرى FormData سيقوم تلقائياً بتغيير الـ Headers إلى multipart/form-data)
    const response = await axiosClient.post('/ai/analyze-cv', formData);
    
    // إرجاع الداتا الصافية (والتي ستحتوي على حالة النجاح ونتيجة الذكاء الاصطناعي)
    return response.data;
  },

  // ============================================================
  // TODO: 3. Job Matching (سيتم برمجته لاحقاً)
  // ============================================================
};