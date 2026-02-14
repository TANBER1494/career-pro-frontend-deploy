import axios from 'axios';
import { BASE_URL } from '../config/constant.js';

// 1. إنشاء نسخة Axios
const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. (Interceptor) إضافة التوكن تلقائياً لكل طلب
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. (Interceptor) معالجة الأخطاء العامة
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // لو التوكن غير صالح (401)، نخرج المستخدم فوراً
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // تأكد إن المسار ده صحيح في مشروعك
      window.location.href = '/src/pages/auth/signup-login.html';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
