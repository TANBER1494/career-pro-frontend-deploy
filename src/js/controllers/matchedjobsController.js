import { authService } from '../services/authService.js';
import { aiFeaturesService } from '../services/aiFeaturesService.js';
import { jobService } from '../services/jobService.js';
import Swal from 'sweetalert2';

// ==========================================
// 1. Elements Selection (DOM Hooks)
// ==========================================
const loadingSection = document.getElementById('loading-section');
const errorSection = document.getElementById('error-section');
const jobsContainer = document.getElementById('matched-jobs-container');
const progressBar = document.getElementById('loading-progress-bar');
const progressText = document.getElementById('loading-percentage');
const loadingCaption = document.getElementById('loading-caption');

let progressInterval = null;
let captionInterval = null;

const loadingCaptions = [
  'Accessing CareerPro global job database...',
  'Fetching your latest CV analysis data...',
  'Comparing your skills with market requirements...',
  'Ranking jobs by compatibility score...',
  'Finalizing your personalized recommendations...',
];

// ============================================================
// 2. SWALS
// ============================================================
function swalDarkConfig(options) {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return Swal.fire({
    background: isDarkMode ? '#1e1b4b' : '#ffffff',
    color: isDarkMode ? '#f8fafc' : '#1e293b',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#64748b',
    ...options,
  });
}

// ==========================================
// 🚀 2. Initialization
// ==========================================
const initializePage = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.replace('/login');
    return;
  }

  initAuthButtons();
  initModalEvents();
  initRefreshButton(); // 🚨 NEW: تفعيل زر التحديث
  startMatchingProcess(false); // false يعني جلب الكاش أولاً
  document.body.classList.add('loaded');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

// ==========================================
// 🔄 NEW: Refresh Button Event Listener
// ==========================================
function initRefreshButton() {
  const refreshBtn = document.getElementById('btn-refresh-matches');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      // تفريغ الوظائف الحالية قبل التحديث
      if (jobsContainer) jobsContainer.innerHTML = '';

      // إيقاف الزر مؤقتاً لتجنب الضغط المزدوج
      refreshBtn.disabled = true;
      const icon = refreshBtn.querySelector('i');
      if (icon) icon.classList.add('fa-spin');

      // تشغيل عملية المطابقة مع إجبار التحديث
      startMatchingProcess(true);
    });
  }
}

// ==========================================
// ⚙️ 3. Logic: Matching Engine Flow
// ==========================================
async function startMatchingProcess(isForceRefresh = false) {
  showLoading(isForceRefresh);
  try {
    // 🚨 تمرير المتغير للسيرفيس
    const response = await aiFeaturesService.getJobMatches(isForceRefresh);

    if (response.status === 'success' && response.data.matches.length > 0) {
      finishLoading(() => {
        renderJobs(response.data.matches);

        // إظهار رسالة نجاح إذا كان الطلب تحديث
        if (isForceRefresh) {
          swalDarkConfig({
            icon: 'success',
            title: 'Updated!',
            text: response.message || 'Successfully found new matches!',
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'bottom-end',
          });
        }
      });
    } else {
      showError(
        'No matches found',
        "We couldn't find jobs matching your current skills."
      );
    }
  } catch (error) {
    const backendMessage =
      error.response?.data?.message ||
      'Something went wrong while connecting to the AI.';
    if (error.response?.status === 400) {
      showError('Action Required', backendMessage);
    } else if (error.response?.status === 404) {
      showError('No Matches Available', backendMessage);
    } else {
      showError('System Error', backendMessage);
    }
  } finally {
    // إعادة الزر لحالته الطبيعية
    const refreshBtn = document.getElementById('btn-refresh-matches');
    if (refreshBtn && isForceRefresh) {
      refreshBtn.disabled = false;
      const icon = refreshBtn.querySelector('i');
      if (icon) icon.classList.remove('fa-spin');
    }
  }
}

// ==========================================
// 🎨 4. UI Transitions
// ==========================================
function showLoading(isForceRefresh = false) {
  loadingSection?.classList.remove('hidden');
  errorSection?.classList.add('hidden');
  jobsContainer?.classList.add('hidden');

  // 🚨 تغيير النص بناءً على نوع الطلب
  const loadingTitle = document.querySelector('#loading-section h3');
  if (loadingTitle) {
    loadingTitle.textContent = isForceRefresh
      ? 'Finding New Jobs...'
      : 'Analyzing Your Profile...';
  }

  let progress = 0;
  let capIdx = 0;

  progressInterval = setInterval(() => {
    if (progress < 92) {
      progress += Math.random() * 3;
      if (progressBar) progressBar.style.width = `${Math.floor(progress)}%`;
      if (progressText) progressText.textContent = `${Math.floor(progress)}%`;
    }
  }, 600);

  captionInterval = setInterval(() => {
    capIdx = (capIdx + 1) % loadingCaptions.length;
    if (loadingCaption) {
      loadingCaption.style.opacity = 0;
      setTimeout(() => {
        loadingCaption.textContent = loadingCaptions[capIdx];
        loadingCaption.style.opacity = 1;
      }, 300);
    }
  }, 3500);
}

function finishLoading(callback) {
  clearInterval(progressInterval);
  clearInterval(captionInterval);
  if (progressBar) progressBar.style.width = '100%';
  if (progressText) progressText.textContent = '100%';
  if (loadingCaption) loadingCaption.textContent = 'Matching Complete!';

  setTimeout(() => {
    loadingSection?.classList.add('hidden');
    jobsContainer?.classList.remove('hidden');
    callback();
  }, 800);
}

function showError(title, message) {
  clearInterval(progressInterval);
  clearInterval(captionInterval);
  loadingSection?.classList.add('hidden');
  errorSection?.classList.remove('hidden');
  const tEl = document.getElementById('error-title');
  const mEl = document.getElementById('error-message');
  if (tEl) tEl.textContent = title;
  if (mEl) mEl.textContent = message;
}

// ==========================================
// 🖼️ 5. Dynamic Rendering
// ==========================================
function renderJobs(matches) {
  if (!jobsContainer) return;

  jobsContainer.innerHTML = matches
    .map((match) => {
      const job = match.jobDetails;
      const score = match.matchPercentage;
      const scoreColor =
        score >= 80
          ? 'text-green-500'
          : score >= 50
            ? 'text-yellow-500'
            : 'text-red-500';

      return `
      <div class="bg-white dark:bg-black/30 rounded-2xl p-5 md:p-7 mb-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all flex flex-col">
          
  <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
              
    <div class="flex items-start gap-4 flex-1 w-full">
                  
      <div class="w-14 h-14 md:w-16 md:h-16 shrink-0 bg-slate-50 dark:bg-indigo-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden p-1">
        <img 
          src="${job.companyId?.logoUrl || 'https://placehold.co/100x100?text=Logo'}" 
          class="w-full h-full object-cover rounded-lg" 
          alt="Logo"
        >
      </div>

      <div class="flex-1">
        <h2 class="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-200 leading-tight pr-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          ${job.title}
        </h2>

        <p class="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold mt-1">
          ${job.companyId?.companyName || 'Confidential'} • ${job.type}
        </p>
                      
        <div class="flex flex-wrap items-center gap-4 mt-3 text-[12px] md:text-[13px] text-slate-600 dark:text-slate-300 font-medium">
                          
          <span class="flex items-center gap-1.5">
            <i class="fa-solid fa-location-dot text-slate-400 dark:text-slate-500"></i> 
            ${job.location}
          </span>

          <span class="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold">
            <i class="fa-solid fa-money-bill-wave"></i> 
            $${job.salaryMin} - $${job.salaryMax}
          </span>

        </div>
      </div>
    </div>

    <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto shrink-0 gap-3 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-4 sm:pt-0 mt-4 sm:mt-0">
                  
      <button 
        onclick="window.handleSaveJob('${job._id}', this)" 
        class="w-10 h-10 rounded-full bg-slate-50 dark:bg-indigo-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-white dark:hover:bg-black/40 transition-all shadow-sm"
      >
        <i class="fa-regular fa-bookmark text-lg text-slate-400 dark:text-slate-300 transition-colors"></i>
      </button>
                  
      <div class="flex flex-col items-start sm:items-end mt-1">
        <div class="text-3xl md:text-4xl font-black ${scoreColor} leading-none">
          ${score}%
        </div>

        <div class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1.5">
          Match Score
        </div>
      </div>

    </div>
  </div>

  <div class="mt-6">
              
    <div class="flex flex-wrap gap-2 mb-3">
      ${(job.skills || [])
        .slice(0, 6)
        .map(
          (skill) => `
            <span class="px-3 py-1.5 bg-slate-100 dark:bg-indigo-950 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold border border-slate-200/60 dark:border-slate-800">
              ${skill}
            </span>
          `
        )
        .join('')}
    </div>

    <p class="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed line-clamp-2">
      ${job.description}
    </p>

  </div>

  <div class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center">
              
    <button 
      onclick="window.applyForJobCheck('${job._id}')" 
      class="py-2.5 px-8 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg shadow-blue-500/30 flex items-center gap-2"
    >
      Apply Now 
      <i class="fa-solid fa-arrow-right text-xs"></i>
    </button>

  </div>
          
</div>`;
    })
    .join('');
}

// ==========================================
// 🔖 6. Logic: Save Job
// ==========================================
window.handleSaveJob = async function (jobId, btnElement) {
  const icon = btnElement.querySelector('i');
  const isSaved = icon.classList.contains('fa-solid');

  if (isSaved) {
    icon.classList.replace('fa-solid', 'fa-regular');
    icon.classList.replace('text-blue-600', 'text-slate-400');
  } else {
    icon.classList.replace('fa-regular', 'fa-solid');
    icon.classList.replace('text-slate-400', 'text-blue-600');
  }

  try {
    await jobService.toggleSaveJob(jobId);
    swalDarkConfig({
      icon: 'success',
      title: isSaved ? 'Removed' : 'Saved',
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 2000,
    });
  } catch (error) {
    if (isSaved) {
      icon.classList.replace('fa-regular', 'fa-solid');
      icon.classList.replace('text-slate-400', 'text-blue-600');
    } else {
      icon.classList.replace('fa-solid', 'fa-regular');
      icon.classList.replace('text-blue-600', 'text-slate-400');
    }
    swalDarkConfig({
      icon: 'error',
      title: 'Action Failed',
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }
};
// ==========================================
// 💼 7. Global Actions (Apply Form Logic)
// ==========================================
window.applyForJobCheck = function (jobId) {
  const token = localStorage.getItem('token');

  if (!token) {
    const isDarkMode = document.documentElement.classList.contains('dark');
  
    Swal.fire({
      icon: 'info',
      title: 'Login Required',
      text: 'You need to login to apply for jobs.',
      showCancelButton: true,
      background: isDarkMode ? '#1e1b4b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Login Now',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) window.location.href = '/login';
    });
    return;
  }

  const modal = document.getElementById('applyModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.dataset.jobId = jobId;

    // Pre-fill Name/Email from local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const nameInput = document.getElementById('applyName');
    const emailInput = document.getElementById('applyEmail');

    if (nameInput && user.firstName)
      nameInput.value = `${user.firstName} ${user.lastName || ''}`.trim();
    if (emailInput && user.email) emailInput.value = user.email;
  }
};
window.closeApplyModal = function () {
  const modal = document.getElementById('applyModal');
  if (modal) modal.classList.add('hidden');

  // بنحاول نلاقي الفورم ونعمله reset لو اتقفل من بره
  const form = document.getElementById('applyForm');
  if (form) form.reset();
};

// ============================================================
// 4. Init Modal Events (The Core Logic)
// ============================================================
function initModalEvents() {
  const modal = document.getElementById('applyModal');
  const closeBtn = document.getElementById('btnCloseModal');

  // ملاحظة: مش هنعرف cancelBtn هنا عشان هيتمسح مع الـ cloning

  let form = document.getElementById('applyForm');

  // --- دالة الإغلاق الموحدة ---
  const close = () => {
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();

    // 🔥 إعادة تعيين نص الملف (عشان يرجع "SVG, PNG..." لما نقفل)
    const fileInput = document.getElementById('applyCv');
    if (fileInput) {
      const dropZone = fileInput.closest('.group');
      const fileNameDisplay = dropZone?.querySelector('p.text-slate-600');
      if (fileNameDisplay) {
        // رجعيه للنص الأصلي اللي عندك في الـ HTML
        fileNameDisplay.textContent = 'SVG, PNG, JPG or GIF (MAX. 800x400px)';
        fileNameDisplay.classList.remove('black', 'font-bold');
      }
    }
  };

  // ربط زر الإغلاق (X)
  if (closeBtn) closeBtn.onclick = close;

  // إغلاق عند الضغط خارج المودال
  window.onclick = (e) => {
    if (e.target === modal) close();
  };

  // 🔥 (إضافة) إغلاق عند الضغط على Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      close();
    }
  });

  if (form) {
    // 1. نسخ الفورم واستبداله (عشان نحل مشكلة الـ Double Submission)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    form = newForm; // تحديث المتغير ليشير للفورم الجديد

    // ✅✅✅ (تصحيح هام) زر Cancel ✅✅✅
    // لازم نجيبه من "newForm" بعد النسخ، ونربطه بدالة القفل تاني
    const newCancelBtn =
      newForm.querySelector('#btnCancelModal') ||
      document.getElementById('btnCancelModal');
    if (newCancelBtn) {
      newCancelBtn.onclick = close;
      newCancelBtn.type = 'button'; // أمان عشان ميعملش submit
    }

    // 🔥 (إضافة) كود إظهار اسم الملف المختار
    const fileInput = document.getElementById('applyCv');
    if (fileInput) {
      const dropZone = fileInput.closest('.group');
      const fileNameDisplay = dropZone?.querySelector('p.text-slate-600');

      fileInput.addEventListener('change', function () {
        if (this.files && this.files[0] && fileNameDisplay) {
          fileNameDisplay.textContent = `Selected: ${this.files[0].name}`;
          fileNameDisplay.classList.add('black', 'font-bold');
        }
      });
    }

    // 2. منطق الإرسال (Submit)
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const jobId = modal.dataset.jobId;

      // جلب العناصر (نتأكد إننا بنجيبهم من الـ DOM الحالي)
      const currentFileInput = document.getElementById('applyCv');
      const nameInput = document.getElementById('applyName');
      const emailInput = document.getElementById('applyEmail');
      const phoneInput = document.getElementById('applyPhone');
      const coverInput = document.getElementById('applyCover');

      if (!currentFileInput.files || currentFileInput.files.length === 0) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        Swal.fire({
          title: 'Warning',
          text: 'Please upload your CV.',
          icon: 'warning',
          background: isDarkMode ? '#1e1b4b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
          confirmButtonColor: '#3b82f6',
        });
        return;
      }

      const applyData = {
        fullName: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        cvFile: currentFileInput.files[0],
        coverLetter: coverInput.value,
      };

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }

        await jobService.applyForJob(jobId, applyData);

        const isDarkMode = document.documentElement.classList.contains('dark');

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Application submitted successfully.',
          background: isDarkMode ? '#1e1b4b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
          showConfirmButton: false,
        });

        close();
      } catch (error) {
        console.error('Apply Error Details:', error);
        let errorMsg = 'Failed to submit application.';

        if (error.response && error.response.status === 409) {
          errorMsg = 'You have already applied for this job.';
        } else if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        }

        const isDarkMode = document.documentElement.classList.contains('dark');

        Swal.fire({
          icon: 'error',
          title: 'Application Failed',
          text: errorMsg,
          background: isDarkMode ? '#1e1b4b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
          confirmButtonColor: '#ef4444',
        });
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Submit Application';
        }
      }
    });
  }
}

function initAuthButtons() {
  const authContainer = document.getElementById('auth-buttons-container');
  if (!authContainer) return;
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  authContainer.className = 'flex items-center gap-3 justify-end';
  
  if (token && user) {
    let navLinkHtml = '';

    if (user.accountType === 'company') {
      authService.logout();
    } else {
      navLinkHtml = `
          <a id="profileBtn" href="/profile" class="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 transition duration-300 whitespace-nowrap">
            <i class="fas fa-user-circle text-3xl"></i>
            <span class="hidden md:inline">Profile</span>
          </a>`;
    }

    // 💡 تم تبديل الترتيب هنا: الـ Logout أولاً ثم الـ Profile
    authContainer.innerHTML = `
    <div class="flex items-center">
        <button 
          id="btnLogout"
          class="group flex items-center justify-start mr-4 w-8 h-8 bg-red-600 rounded-full cursor-pointer relative overflow-hidden transition-all duration-500 shadow-lg md:hover:w-32 md:hover:rounded-3xl active:translate-x-1 active:translate-y-1"
        >
          <div class="flex items-center justify-center w-full transition-all duration-300 md:group-hover:justify-start md:group-hover:px-3">
            <svg class="w-4 h-4" viewBox="0 0 512 512" fill="white">
              <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
            </svg>
          </div>
          <div class="absolute right-5 transform translate-x-full opacity-0 text-white text-lg font-semibold transition-all duration-500 md:group-hover:translate-x-0 md:group-hover:opacity-100">
            Logout
          </div>
        </button>
    </div>
    
    ${navLinkHtml}
`;

    document.getElementById('btnLogout').addEventListener('click', () => {
      authService.logout();
    });
  } else {
    // للزائر
    authContainer.innerHTML = `
            <a href="/login" class="text-sm font-medium text-slate-600 hover:text-blue-600">Login</a>
            <a href="/signup?mode=signup" class="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition shadow-md shadow-blue-500/30">Sign Up</a>
        `;
  }
}