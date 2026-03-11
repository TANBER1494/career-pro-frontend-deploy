// src/js/utils/authGuard.js

(function globalAuthGuard() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const currentPath = window.location.pathname;

  // 1. إذا كان المستخدم مسجل دخول
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);

      // --- أ. حماية الأدمن ---
      if (user.accountType === 'admin' || user.role === 'admin') {
        // لو هو أدمن ومش في صفحة الأدمن، اطرده على الداشبورد بتاعته
        if (!currentPath.startsWith('/admin')) {
          document.documentElement.style.display = 'none';
          window.location.replace('/admin');
        }
        return; 
      }

      // --- ب. إجبار استكمال البيانات ---
      const currentStep = parseInt(user.registrationStep) || 1;
      
      if (currentStep < 4) {
        let targetPage = '';
        if (user.accountType === 'job_seeker' || user.role === 'job_seeker') {
          targetPage = `/SeekerStep${currentStep}`;
        } else if (user.accountType === 'company' || user.role === 'company') {
          targetPage = `/CompanyStep${currentStep}`;
        }

        // 💡 الحماية من اللوب اللانهائي: التوجيه فقط لو هو مش في صفحة الخطوة نفسها
        if (targetPage && currentPath !== targetPage && currentPath !== '/login' && currentPath !== '/signup') {
          document.documentElement.style.display = 'none'; // منع وميض الصفحة
          window.location.replace(targetPage);
          return;
        }
      } 
      // --- ج. منع الدخول لصفحات الدخول لو هو مكمل بياناته ومسجل ---
      else {
        if (currentPath === '/login' || currentPath === '/signup') {
          document.documentElement.style.display = 'none';
          const redirectHome = (user.accountType === 'company' || user.role === 'company') ? '/Company_dashboard' : '/CareerPro';
          window.location.replace(redirectHome);
        }
      }
    } catch (e) {
      console.error("Auth Guard Error:", e);
    }
  } 
  // 2. إذا كان المستخدم غير مسجل دخول (ضيف)
  else {
    // قائمة بالصفحات المحرمة على الزوار (تقدر تزود عليها براحتك)
    const privateRoutes = ['/profile', '/Company_dashboard', '/admin', '/applications', '/post_job', '/edit_job'];
    
    const isPrivateRoute = privateRoutes.some(route => currentPath.startsWith(route));
    
    if (isPrivateRoute) {
      document.documentElement.style.display = 'none';
      window.location.replace('/login');
    }
  }
})();