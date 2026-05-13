import { companyDiscoveryService } from '../services/companyDiscoveryService.js';
import { jobService } from '../services/jobService.js'; // ✅ ضروري لعمليات الحفظ
import Swal from 'sweetalert2';

// ============================================================
// Initialization
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('id');

  if (!companyId) {
    window.location.href = '/companies';
    return;
  }

  await loadCompanyDetails(companyId);

  // تفعيل المودال (للتقديم)
  initModalEvents();
});

// ============================================================
// Fetch Logic
// ============================================================
async function loadCompanyDetails(id) {
  const loader = document.getElementById('details-loader');
  const content = document.getElementById('details-content');

  try {
    const response = await companyDiscoveryService.getCompanyDetails(id);
    const responseData = response.data || {};

    const company = responseData.company;
    let openPositions = responseData.openPositions || [];

    if (!company) {
      throw new Error('Company data not found');
    }

    // ============================================================
    // 🔥 SYNC SAVED STATUS (نفس المنطق المستخدم في All Jobs)
    // ============================================================
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // 1. جلب الوظائف المحفوظة للمستخدم
        const savedResponse = await jobService.getSavedJobs();
        const savedJobs = savedResponse.data.jobs || [];

        // 2. إنشاء Set للبحث السريع
        const savedIds = new Set(savedJobs.map((j) => j._id || j.id));

        // 3. تحديث مصفوفة الوظائف بإضافة isSaved
        openPositions = openPositions.map((job) => ({
          ...job,
          isSaved: savedIds.has(job._id || job.id),
        }));
      } catch (err) {
        console.warn('Could not sync saved jobs in company details', err);
      }
    }
    // ============================================================

    // Render Data
    renderCompanyHeader(company);
    renderCompanyAbout(company);
    renderCompanyJobs(openPositions, company);

    if (loader) loader.classList.add('hidden');
    if (content) content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading details:', error);
    if (content) {
      content.innerHTML = `
                <div class="text-center py-20">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i>
                    <p class="text-slate-500">Failed to load company details.</p>
                    <a href="/companies" class="text-blue-600 hover:underline mt-2 inline-block">Back to Companies</a>
                </div>
            `;
      content.classList.remove('hidden');
      if (loader) loader.classList.add('hidden');
    }
  }
}

// ============================================================
// Render Logic: Header & Info
// ============================================================
function renderCompanyHeader(company) {
  const name = company.name || company.companyName || 'Unknown';

  setText('detail-name', name);
  setText('detail-industry', company.industry);
  setText('detail-location', company.location);
  setText('detail-size', company.size || company.companySize);
  setText('detail-founded', company.foundedYear);

  const alertBox = document.getElementById('detail-verified-alert');
  if (alertBox) {
    if (company.isVerified) alertBox.classList.add('hidden');
    else alertBox.classList.remove('hidden');
  }

  const webBtn = document.getElementById('detail-website');
  if (webBtn) {
    if (company.website) {
      webBtn.href = company.website.startsWith('http')
        ? company.website
        : `https://${company.website}`;
      webBtn.classList.remove('hidden');
    } else {
      webBtn.classList.add('hidden');
    }
  }

  const logoImg = document.getElementById('detail-logo');
  const logoInit = document.getElementById('detail-initial');

  if (logoImg && logoInit) {
    if (company.logo && company.logo.length > 10) {
      // ✅ Fix URL: Direct assignment for Cloudinary
      logoImg.src = company.logo;

      logoImg.classList.remove('hidden');
      logoInit.classList.add('hidden');
    } else {
      // ... fallback code (كما هو عندك)
    }
  }
}

function renderCompanyAbout(company) {
  const description =
    company.description ||
    company.companyDescription ||
    company.about ||
    'No description provided by the company.';
  const descEl = document.getElementById('detail-desc');
  if (descEl) descEl.innerText = description;

  const benefitsContainer = document.getElementById('detail-benefits');
  if (benefitsContainer) {
    const benefits = company.benefits || [];
    if (benefits.length > 0) {
      benefitsContainer.innerHTML = benefits
        .map(
          (benefit) => `
                <span class="px-3 py-1.5 bg-green-50 dark:bg-green-500/60 text-green-400/60 dark:text-green-100 text-xs font-medium rounded-lg border border-green-100 dark:border-green-500/60 flex items-center gap-2">
                    <i class="fa-solid fa-check text-[10px]"></i> ${benefit}
                </span>
            `
        )
        .join('');
    } else {
      benefitsContainer.innerHTML =
        '<span class="text-slate-400 text-xs italic">No specific benefits listed.</span>';
    }
  }
}

// Render Logic: Jobs Cards (Fix Logo Issue)
// ============================================================
function renderCompanyJobs(jobs, companyInfo) {
  const jobsList = document.getElementById('detail-jobs-list');
  const jobsCountLabel = document.getElementById('detail-jobs-count');

  if (jobsCountLabel) jobsCountLabel.innerText = jobs.length;

  if (!jobsList) return;

  if (jobs.length === 0) {
    jobsList.innerHTML = `
            <div class="text-center py-10 bg-slate-50 dark:bg-black/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <i class="fa-solid fa-briefcase text-slate-300 dark:text-slate-200 text-2xl mb-2"></i>
                <p class="text-slate-500 dark:text-slate-400 text-sm">No open positions at the moment.</p>
            </div>
        `;
    return;
  }

  // 1. تجهيز البيانات الأساسية للشركة
  const companyName =
    companyInfo.name || companyInfo.companyName || 'Hiring Company';
  const location = companyInfo.location || 'Remote';

  // 2. 🔥 معالجة اللوجو (الحل الجذري)
  // نبحث عن logo أو logoUrl (لأن الباك إند قد يرسل أي منهما)
  let rawLogo = companyInfo.logo || companyInfo.logoUrl;
  let companyLogo = 'https://placehold.co/48x48?text=Logo';

  if (rawLogo && rawLogo.length > 10) {
    // التغيير: الرابط يأتي جاهزاً من الباك إند، لا داعي لأي معالجة
    companyLogo = rawLogo;
  }

  // رسم الكروت
  jobsList.innerHTML = jobs
    .map((job) => {
      const timeAgo = getTimeAgo(job.postedAt || job.createdAt);
      const jobId = job.id || job._id;

      const saveIconClass = job.isSaved
        ? 'fa-solid text-blue-600'
        : 'fa-regular text-slate-400';

      const skillsHTML = (job.skills || [])
        .slice(0, 3)
        .map(
          (skill) =>
            `<span class="px-2 py-1 bg-slate-100 dark:bg-black/30 text-slate-600 dark:text-slate-200 rounded text-[10px] font-medium ">${skill}</span>`
        )
        .join('');

        return `
        <div class="bg-white dark:bg-black/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative group border border-slate-200 dark:border-slate-800 flex flex-col h-full mb-4 text-left">
            
            <button onclick="window.toggleSaveJob('${jobId}', this)" class="absolute top-5 right-5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-20 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50" title="Save Job">
                <i class="${saveIconClass} fa-bookmark text-lg"></i>
            </button>
        
            <div class="flex items-start gap-4 mb-3">
                <div class="w-12 h-12 rounded-lg bg-blue-50 dark:bg-black/30 flex items-center justify-center overflow-hidden shrink-0 border border-blue-100 dark:border-slate-800 p-1">
                    <img src="${companyLogo}" alt="${companyName}" class="w-full h-full object-cover rounded-md" onerror="this.src='https://placehold.co/48x48?text=Error'">
                </div>
                <div>
                    <h3 class="font-medium font-poppins text-slate-900 dark:text-slate-200 leading-tight line-clamp-1">
                        ${job.title}
                    </h3>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span class="font-medium text-slate-700 dark:text-slate-300">
                            <i class="fa-regular fa-building mr-1"></i> ${companyName}
                        </span>
                        <span><i class="fa-solid fa-location-dot mr-1"></i> ${location}</span>
                    </div>
                </div>
            </div>
        
            <div class="flex flex-wrap gap-2 mb-4 h-12 overflow-hidden content-start">
                ${skillsHTML}
            </div>
        
            <div class="flex items-center justify-between mb-4 mt-auto border-t border-slate-50 dark:border-slate-800 pt-3">
                <span class="text-green-600 dark:text-green-500 font-semibold font-poppins text-xs">
                    ${job.salaryRange || 'Competitive'}
                </span>
                <span class="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1">
                    <i class="fa-regular fa-clock"></i> ${timeAgo}
                </span>
            </div>
        
            <div class="flex items-center gap-2">
                <span class="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-black/30">
                    ${job.type || 'Full Time'}
                </span>
                <button onclick="window.openApplyModal('${jobId}')" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-xs font-medium rounded-lg transition-colors shadow-blue-500/20 shadow-sm ml-auto text-center">
                    Apply Now
                </button>
            </div>
        </div>
        `;
    })
    .join('');
}
// ============================================================
// ✅ GLOBAL ACTIONS (Toggle Save & Apply)
// ============================================================

// 1. Toggle Save Logic
window.toggleSaveJob = async function (jobId, btnElement) {
  const token = localStorage.getItem('token');

if (!token) {
  const isDarkMode = document.documentElement.classList.contains('dark');
  Swal.fire({
    title: 'Login Required',
    text: 'Please login to save jobs.',
    icon: 'info',
    background: isDarkMode ? '#1e1b4b' : '#ffffff',
    color: isDarkMode ? '#f8fafc' : '#1e293b',
    confirmButtonColor: '#3b82f6',
  });
  return;
}

  try {
    const icon = btnElement.querySelector('i');
    const isSaved = icon.classList.contains('fa-solid');

    // UI Update (Optimistic)
    if (isSaved) {
      icon.classList.remove('fa-solid', 'text-blue-600');
      icon.classList.add('fa-regular', 'text-slate-400');
    } else {
      icon.classList.remove('fa-regular', 'text-slate-400');
      icon.classList.add('fa-solid', 'text-blue-600');
    }

    await jobService.toggleSaveJob(jobId);
  } catch (error) {
    console.error('Save Error:', error);
  
    const isDarkMode = document.documentElement.classList.contains('dark');
    Swal.fire({
      title: 'Error',
      text: 'Failed to save job.',
      icon: 'error',
      background: isDarkMode ? '#1e1b4b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      confirmButtonColor: '#ef4444',
    });
    // Revert UI on error (optional but recommended)
  }
};

// 2. Open Apply Modal (Using the Profile Page Logic)
// 2. Open Apply Modal (Using the Profile Page Logic)
window.openApplyModal = function (jobId) {
  const token = localStorage.getItem('token');

if (!token) {
  const isDarkMode =
    document.documentElement.classList.contains('dark');

  Swal.fire({
    icon: 'info',
    title: 'Login Required',
    text: 'You need to login to apply.',
    showCancelButton: true,
    confirmButtonText: 'Login',
    cancelButtonText: 'Cancel',
    background: isDarkMode ? '#1e1b4b' : '#ffffff',
    color: isDarkMode ? '#f8fafc' : '#1e293b',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#64748b',
  }).then((res) => {
    if (res.isConfirmed) window.location.href = '/login';
  });
  return;
}

  const modal = document.getElementById('applyModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.dataset.jobId = jobId;

    // Prefill Data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const nameInput = document.getElementById('applyName');
    const emailInput = document.getElementById('applyEmail');

    if (nameInput && user.firstName)
      nameInput.value = `${user.firstName} ${user.lastName || ''}`.trim();
    if (emailInput && user.email) emailInput.value = user.email;
  }
};

// دالة الإغلاق العامة
window.closeApplyModal = function () {
  const modal = document.getElementById('applyModal');
  if (modal) modal.classList.add('hidden');

  const form = document.getElementById('applyForm');
  if (form) form.reset();
};

function initModalEvents() {
  const modal = document.getElementById('applyModal');
  const closeBtn = document.getElementById('btnCloseModal');

  // لاحظي: شيلنا تعريف cancelBtn من هنا لأنه هيتغير تحت
  // const cancelBtn = document.getElementById("btnCancelModal"); <-- مش محتاجينه هنا

  let form = document.getElementById('applyForm');

  // --- دالة الإغلاق الموحدة ---
  const close = () => {
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();

    // إعادة تعيين نص الملف
    const fileInput = document.getElementById('applyCv');
    if (fileInput) {
      const dropZone = fileInput.closest('.group');
      const fileNameDisplay = dropZone?.querySelector('p.text-slate-600');
      if (fileNameDisplay) {
        fileNameDisplay.textContent = 'SVG, PNG, JPG or GIF (MAX. 800x400px)';
        fileNameDisplay.classList.remove('black', 'font-bold');
      }
    }
  };

  if (closeBtn) closeBtn.onclick = close;

  // إغلاق عند الضغط خارج المودال
  window.onclick = (e) => {
    if (e.target === modal) close();
  };

  // إغلاق عند الضغط على Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      close();
    }
  });

  if (form) {
    // 1. نسخ الفورم
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    form = newForm;

    // ✅✅✅ الجزء المضاف لتصليح زرار Cancel ✅✅✅
    // بنجيب الزرار من "الفورم الجديد" ونربطه بدالة القفل
    const newCancelBtn = newForm.querySelector('#btnCancelModal');
    if (newCancelBtn) {
      newCancelBtn.onclick = close; // ربطناه بدالة الإغلاق
      newCancelBtn.type = 'button'; // تأكيد إنه مش submit
    }
    // ✅✅✅ نهاية التعديل ✅✅✅

    // كود إظهار اسم الملف
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

    // تعريف زر الإرسال الجديد
    const newSubmitBtn = newForm.querySelector('button[type="submit"]');

    // Submit Logic
    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const jobId = modal.dataset.jobId;
      const currentFileInput = document.getElementById('applyCv');

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
        fullName: document.getElementById('applyName').value,
        email: document.getElementById('applyEmail').value,
        phone: document.getElementById('applyPhone').value,
        cvFile: currentFileInput.files[0],
        coverLetter: document.getElementById('applyCover').value,
      };

      try {
        if (newSubmitBtn) {
          newSubmitBtn.disabled = true;
          newSubmitBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }

        await jobService.applyForJob(jobId, applyData);

        const isDarkMode = document.documentElement.classList.contains('dark');

        Swal.fire({
          title: 'Success',
          text: 'Application submitted successfully!',
          icon: 'success',
          background: isDarkMode ? '#1e1b4b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
          confirmButtonColor: '#3b82f6',
        });
        close();
      } catch (error){
        let msg = 'Failed to submit application.';
      
        if (error.response?.status === 409)
          msg = 'You have already applied for this job.';
        else if (error.response?.data?.message)
          msg = error.response.data.message;
      
        const isDarkMode = document.documentElement.classList.contains('dark');
      
        Swal.fire({
          title: 'Error',
          text: msg,
          icon: 'error',
          background: isDarkMode ? '#1e1b4b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
          confirmButtonColor: '#ef4444',
        });
      } finally {
        if (newSubmitBtn) {
          newSubmitBtn.disabled = false;
          newSubmitBtn.innerHTML = 'Submit Application';
        }
      }
    });
  }
}

// Helpers
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text || 'N/A';
}

function getTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  return 'Just now';
}
