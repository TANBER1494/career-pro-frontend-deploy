import axios from 'axios';
import { BASE_URL } from '../config/constant.js';
import Swal from 'sweetalert2';

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

// 3. (Interceptor) معالجة الأخطاء العامة والتوجيه الإجباري
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || '';

      // الحالة الأولى: التوكن غير صالح أو منتهي (401)
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login'; // تأكد إن مسار صفحة اللوجن بتاعك اسمه كدا
      }

      // 🔥 الحالة الثانية: المستخدم تم إيقافه أو حذفه وهو أونلاين (403)
      if (status === 403 && (message.toLowerCase().includes('suspended') || message.toLowerCase().includes('deleted'))) {
        // 1. تدمير الجلسة محلياً
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 2. إيقاف أي توجيه آخر وعرض رسالة الطرد
        Swal.fire({
          icon: 'error',
          title: 'Session Terminated 🚫',
          text: message, // هيعرضله رسالة الباك إند (موقوف لحد كذا أو محذوف)
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Go to Login',
          allowOutsideClick: false, // نمنعه يقفل الرسالة ويقعد في الصفحة
          allowEscapeKey: false
        }).then(() => {
          // 3. الطرد لصفحة الدخول
          window.location.href = '/login'; 
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;