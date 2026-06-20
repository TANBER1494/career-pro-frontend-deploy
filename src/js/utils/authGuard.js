(function globalAuthGuard() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const currentPath = window.location.pathname;

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);

      // --- 1. حماية الأدمن ---
      if (user.accountType === 'admin' || user.role === 'admin') {
        if (!currentPath.startsWith('/admin')) {
          document.documentElement.style.display = 'none';
          window.location.replace('/admin');
        }
        return;
      }

      // --- 2. إجبار استكمال البيانات ---
// --- 2. إجبار استكمال البيانات مع السماح بالرجوع للخطوات السابقة ---
const currentStep = parseInt(user.registrationStep) || 1;

if (currentStep < 4) {
  const isSeeker =
    user.accountType === 'job_seeker' || user.role === 'job_seeker';

  const isCompany =
    user.accountType === 'company' || user.role === 'company';

  // لو المستخدم في صفحات الـ Seeker
  if (isSeeker && currentPath.includes('SeekerStep')) {
    const pageStep = parseInt(
      currentPath.match(/SeekerStep(\d+)/)?.[1]
    );

    // امنعي فقط الذهاب لخطوة أكبر من المسموح
    if (pageStep > currentStep) {
      document.documentElement.style.display = 'none';
      window.location.replace(`/SeekerStep${currentStep}`);
      return;
    }
  }

  // لو المستخدم في صفحات الـ Company
  if (isCompany && currentPath.includes('CompanyStep')) {
    const pageStep = parseInt(
      currentPath.match(/CompanyStep(\d+)/)?.[1]
    );

    // امنعي فقط الذهاب لخطوة أكبر من المسموح
    if (pageStep > currentStep) {
      document.documentElement.style.display = 'none';
      window.location.replace(`/CompanyStep${currentStep}`);
      return;
    }
  }

  // لو حاول يروح أي صفحة خارج خطوات التسجيل قبل ما يخلصها
  const allowedRoutes = [
    '/login',
    '/signup',
    '/SeekerStep1',
    '/SeekerStep2',
    '/SeekerStep3',
    '/CompanyStep1',
    '/CompanyStep2',
    '/CompanyStep3',
  ];

  if (!allowedRoutes.some((route) => currentPath.startsWith(route))) {
    document.documentElement.style.display = 'none';

    const targetPage = isSeeker
      ? `/SeekerStep${currentStep}`
      : `/CompanyStep${currentStep}`;

    window.location.replace(targetPage);
    return;
  }
}
      // --- 3. منع الدخول لصفحات الدخول والتسجيل ---
      else if (currentPath === '/login' || currentPath === '/signup') {
        document.documentElement.style.display = 'none';
        const redirectHome =
          user.accountType === 'company' || user.role === 'company'
            ? '/Company_dashboard'
            : '/CareerPro';
        window.location.replace(redirectHome);
        return;
      }

      // =========================================================
      // 🚨 4. التحديث الجديد: حماية الصفحات بناءً على نوع الحساب (RBAC) 🚨
      // =========================================================
      const isCompany =
        user.accountType === 'company' || user.role === 'company';
      const isSeeker =
        user.accountType === 'job_seeker' || user.role === 'job_seeker';

      // قائمة الصفحات الممنوعة على طالب العمل (الخاصة بالشركات فقط)
      const companyOnlyRoutes = [
        '/Company_dashboard',
        '/Company_profile',
        '/Company_jobs',
        '/verification',
        '/post_job',
        '/edit_job',
        '/applications',
      ];
      // قائمة الصفحات الممنوعة على الشركات (الخاصة بطلبة العمل فقط)
      const seekerOnlyRoutes = ['/profile', '/CareerPro']; // ضيف أي صفحات تانية تخص الطالب بس

      // لو طالب عمل بيحاول يدخل صفحة شركة -> اطرده للصفحة الرئيسية
      if (
        isSeeker &&
        companyOnlyRoutes.some((route) => currentPath.startsWith(route))
      ) {
        document.documentElement.style.display = 'none';
        window.location.replace('/CareerPro');
        return;
      }

      // لو شركة بتحاول تدخل صفحة طالب عمل -> اطردها لداشبورد الشركة
      if (
        isCompany &&
        seekerOnlyRoutes.some(
          (route) =>
            currentPath === route || currentPath.startsWith(route + '/')
        )
      ) {
        document.documentElement.style.display = 'none';
        window.location.replace('/Company_dashboard');
        return;
      }
      // =========================================================
    } catch (e) {
      console.error('Auth Guard Error:', e);
    }
  } else {
    // الزوار (غير المسجلين)
    const privateRoutes = [
      '/profile',
      '/Company_dashboard',
      '/admin',
      '/applications',
      '/post_job',
      '/edit_job',
      '/Company_profile',
      '/Company_jobs',
      '/verification',
    ];
    const isPrivateRoute = privateRoutes.some(
      (route) => currentPath === route || currentPath.startsWith(route + '/')
    );

    if (isPrivateRoute) {
      document.documentElement.style.display = 'none';
      window.location.replace('/login');
    }
  }
})();
