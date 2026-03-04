import axiosClient from "../utils/axiosClient.js";

export const aiFeaturesService = {
  // ============================================================
  // 1. Personality Test (MBTI)
  // ============================================================
  
  // جلب الـ 30 سؤال من الباك إند
  async getPersonalityQuestions() {
    const response = await axiosClient.get("/personality/questions");
    return response.data;
  },

  // إرسال المصفوفة (30 إجابة) واستلام كارت النتيجة
  async submitPersonalityTest(answersArray) {
    const response = await axiosClient.post("/personality/submit", {
      answers: answersArray,
    });
    return response.data;
  },

  // ============================================================
  // TODO: 2. CV Analyzer (سيتم برمجته لاحقاً)
  // ============================================================
  
  // ============================================================
  // TODO: 3. Job Matching (سيتم برمجته لاحقاً)
  // ============================================================
};