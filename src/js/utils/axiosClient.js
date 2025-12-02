import axios from "axios";
import { BASE_URL } from "../config/constant.js";

// 1. إنشاء نسخة Axios
const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. (Interceptor) إضافة التوكن تلقائياً لكل طلب
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. (Interceptor) معالجة الأخطاء العامة (اختياري بس مفيد)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // لو التوكن انتهى أو غير صالح (401)، ممكن نعمل logout تلقائي
    if (error.response && error.response.status === 401) {
      // localStorage.removeItem('token');
      // window.location.href = '/pages/auth/login.html';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
