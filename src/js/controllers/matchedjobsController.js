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
  const modal = document.getElementById('applyModal');
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modal.querySelector('div').classList.remove('scale-95');
    }, 10);
    modal.dataset.jobId = jobId;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (document.getElementById('applyName'))
      document.getElementById('applyName').value =
        `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (document.getElementById('applyEmail'))
      document.getElementById('applyEmail').value = user.email || '';
  }
};

window.closeApplyModal = function () {
  const modal = document.getElementById('applyModal');
  if (modal) {
    modal.classList.add('opacity-0');
    modal.querySelector('div')?.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
  }

  const form = document.getElementById('applyForm');
  if (form) form.reset();

  // إعادة مربع الـ CV لحالته الأصلية
  const fileText = document.getElementById('cvFileText');
  if (fileText) {
    fileText.textContent = 'Drag and drop your CV here or click to browse';
    fileText.classList.remove(
      'text-blue-600',
      'dark:text-blue-400',
      'font-bold'
    );
    fileText.classList.add('text-slate-600', 'dark:text-slate-500');
  }
};

function initModalEvents() {
  const modal = document.getElementById('applyModal');
  let form = document.getElementById('applyForm');

  // إغلاق المودال عند الضغط في أي مكان فارغ بالخارج
  window.addEventListener('click', (e) => {
    if (e.target === modal) window.closeApplyModal();
  });

  if (form) {
    // استنساخ الفورم لتنظيف أي Events قديمة
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    form = newForm;

    const cancelBtn = form.querySelector('#btnCancelModal');
    if (cancelBtn) {
      cancelBtn.type = 'button';
      cancelBtn.onclick = window.closeApplyModal;
    }

    // 🚨 تفعيل وظيفة تغيير النص عند اختيار CV
    const fileInput = form.querySelector('#applyCv');
    const fileText = form.querySelector('#cvFileText');

    if (fileInput && fileText) {
      fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          // في حالة اختيار ملف، يتغير النص للون الأزرق و يظهر اسم الملف
          fileText.textContent = `Selected: ${this.files[0].name}`;
          fileText.classList.remove('text-slate-600', 'dark:text-slate-500');
          fileText.classList.add(
            'text-blue-600',
            'dark:text-blue-400',
            'font-bold'
          );
        } else {
          // في حالة الإلغاء، يعود للون الرمادي
          fileText.textContent =
            'Drag and drop your CV here or click to browse';
          fileText.classList.remove(
            'text-blue-600',
            'dark:text-blue-400',
            'font-bold'
          );
          fileText.classList.add('text-slate-600', 'dark:text-slate-500');
        }
      });
    }

    // منطق الإرسال (Submit)
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const jobId = modal.dataset.jobId;
      const cvFile = form.querySelector('#applyCv').files[0];

      if (!cvFile) {
        swalDarkConfig({
          title: 'Warning',
          text: 'Please upload your CV.',
          icon: 'warning',
        });
        return;
      }

      const applyData = {
        fullName: form.querySelector('#applyName').value,
        email: form.querySelector('#applyEmail').value,
        phone: form.querySelector('#applyPhone').value,
        coverLetter: form.querySelector('#applyCover').value,
        cvFile: cvFile,
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }
        await jobService.applyForJob(jobId, applyData);
        swalDarkConfig({
          icon: 'success',
          title: 'Success!',
          text: 'Application submitted successfully.',
          timer: 2000,
          showConfirmButton: false,
        });
        window.closeApplyModal();
      } catch (error) {
        let errorMsg =
          error.response?.status === 409
            ? 'You have already applied for this job.'
            : error.response?.data?.message || 'Failed to submit application.';
        swalDarkConfig({
          icon: 'error',
          title: 'Application Failed',
          text: errorMsg,
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
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && authContainer) {
    authContainer.innerHTML = `
      <a href="/profile" class="text-base font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-slate-200 transition duration-300 flex items-center gap-2"><i class="fas fa-user-circle text-xl"></i> Profile</a>
    `;
  }
}
