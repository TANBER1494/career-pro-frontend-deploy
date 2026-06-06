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

// ==========================================
// 🚀 2. Initialization (The Fix for Module Scripts)
// ==========================================
const initializePage = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.replace('/login');
    return;
  }

  initAuthButtons();
  initModalEvents(); // 🚨 تم وضعها هنا لتعمل فوراً وتفعل زر التقديم
  startMatchingProcess();
  document.body.classList.add('loaded');
};

// ضمان التشغيل حتى لو كان Script Module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

// ==========================================
// ⚙️ 3. Logic: Matching Engine Flow
// ==========================================
async function startMatchingProcess() {
  showLoading();
  try {
    const response = await aiFeaturesService.getJobMatches();
    if (response.status === 'success' && response.data.matches.length > 0) {
      finishLoading(() => {
        renderJobs(response.data.matches);
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
  }
}

// ==========================================
// 🎨 4. UI Transitions
// ==========================================
function showLoading() {
  loadingSection?.classList.remove('hidden');
  errorSection?.classList.add('hidden');
  jobsContainer?.classList.add('hidden');

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
// 🖼️ 5. Dynamic Rendering (The UI Masterpiece)
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
      <div class="bg-white rounded-2xl p-5 md:p-7 mb-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all flex flex-col">
          
          <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
              
              <div class="flex items-start gap-4 flex-1 w-full">
                  <div class="w-14 h-14 md:w-16 md:h-16 shrink-0 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden p-1">
                      <img src="${job.companyId?.logoUrl || 'https://placehold.co/100x100?text=Logo'}" class="w-full h-full object-cover rounded-lg" alt="Logo">
                  </div>
                  <div class="flex-1">
                      <h2 class="text-lg md:text-xl font-bold text-slate-900 leading-tight pr-4 hover:text-blue-600 transition-colors">${job.title}</h2>
                      <p class="text-slate-500 text-xs md:text-sm font-semibold mt-1">${job.companyId?.companyName || 'Confidential'} • ${job.type}</p>
                      
                      <div class="flex flex-wrap items-center gap-4 mt-3 text-[12px] md:text-[13px] text-slate-600 font-medium">
                          <span class="flex items-center gap-1.5"><i class="fa-solid fa-location-dot text-slate-400"></i> ${job.location}</span>
                          <span class="flex items-center gap-1.5 text-green-600 font-bold"><i class="fa-solid fa-money-bill-wave"></i> $${job.salaryMin} - $${job.salaryMax}</span>
                      </div>
                  </div>
              </div>

              <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto shrink-0 gap-3 border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0 mt-4 sm:mt-0">
                  
                  <button onclick="window.handleSaveJob('${job._id}', this)" class="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-white transition-all shadow-sm">
                      <i class="fa-regular fa-bookmark text-lg text-slate-400 transition-colors"></i>
                  </button>
                  
                  <div class="flex flex-col items-start sm:items-end mt-1">
                      <div class="text-3xl md:text-4xl font-black ${scoreColor} leading-none">${score}%</div>
                      <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Match Score</div>
                  </div>
              </div>
          </div>

          <div class="mt-6">
              <div class="flex flex-wrap gap-2 mb-3">
                  ${(job.skills || [])
                    .slice(0, 6)
                    .map(
                      (skill) =>
                        `<span class="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold border border-slate-200/60">${skill}</span>`
                    )
                    .join('')}
              </div>
              <p class="text-slate-600 text-sm md:text-base leading-relaxed line-clamp-2">
                  ${job.description}
              </p>
          </div>

          <div class="mt-6 pt-5 border-t border-slate-100 flex justify-end items-center">
              <button onclick="window.applyForJobCheck('${job._id}')" class="py-2.5 px-8 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg shadow-blue-500/30 flex items-center gap-2">
                  Apply Now <i class="fa-solid fa-arrow-right text-xs"></i>
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
    Swal.fire({
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
    Swal.fire({
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
  const fileText = document.getElementById('cvFileText');
  if (fileText)
    fileText.textContent = 'Drag and drop your CV here or click to browse';
};

function initModalEvents() {
  const modal = document.getElementById('applyModal');
  let form = document.getElementById('applyForm');

  document
    .getElementById('btnCloseModal')
    ?.addEventListener('click', window.closeApplyModal);
  window.addEventListener('click', (e) => {
    if (e.target === modal) window.closeApplyModal();
  });

  if (form) {
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    form = newForm;

    const cancelBtn = form.querySelector('#btnCancelModal');
    if (cancelBtn) {
      cancelBtn.type = 'button';
      cancelBtn.onclick = window.closeApplyModal;
    }

    const fileInput = form.querySelector('#applyCv');
    const fileText = form.querySelector('#cvFileText');
    if (fileInput && fileText) {
      fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          fileText.textContent = `Selected: ${this.files[0].name}`;
          fileText.classList.add('font-bold', 'text-blue-600');
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const jobId = modal.dataset.jobId;
      const cvFile = form.querySelector('#applyCv').files[0];

      if (!cvFile) {
        Swal.fire('Warning', 'Please upload your CV.', 'warning');
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
        Swal.fire({
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
        Swal.fire({
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
      <a href="/profile" class="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2"><i class="fas fa-user-circle text-lg"></i> Profile</a>
      <button id="btnLogout" class="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">Logout</button>
    `;
    document
      .getElementById('btnLogout')
      .addEventListener('click', () => authService.logout());
  }
}
