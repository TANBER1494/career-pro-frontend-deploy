import { applicationService } from '../services/applicationService.js';
import { jobManagementService } from '../services/jobManagementService.js';
import { authService } from '../services/authService.js';
import Swal from 'sweetalert2';
import Toastify from 'toastify-js';

// ============================================================
// 1. Elements & State
// ============================================================
const container = document.getElementById('applicationsContainer');
const searchInput = document.getElementById('searchInput');
// ❌ تم حذف فلاتر الحالة والوظيفة من هنا

// Pagination Elements
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statNew = document.getElementById('stat-new');
const statReviewing = document.getElementById('stat-reviewing');
const statInterviewed = document.getElementById('stat-interviewed');
const statHired = document.getElementById('stat-hired');
const btnLogout = document.getElementById('btnLogout');

let currentPage = 1;
let currentLimit = 100;
let debounceTimer;
let allFetchedApps = [];

// ============================================================
// 2. Initialization
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // ❌ تم حذف loadJobsForFilter()
  loadStats();
  loadApplications();
});
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
// ============================================================
// 3. Data Fetching
// ============================================================

// B. Load Dashboard Stats (No changes)
async function loadStats() {
  try {
    const res = await jobManagementService.getCompanyStats();
    const stats = res.data.stats;

    if (statTotal) statTotal.textContent = stats.totalApplications || 0;
    if (statNew) statNew.textContent = '-';
  } catch (error) {
    console.error('Stats error', error);
  }
}

// C. Load Applications List (Updated)
async function loadApplications() {
  try {
    container.innerHTML =
      '<div class="text-center py-10 text-gray-500"><i class="fas fa-spinner fa-spin text-2xl"></i><p class="mt-2">Fetching candidates...</p></div>';

    // ✅ تم إزالة Status و JobId من الفلتر
    const filters = {
      page: currentPage,
      limit: currentLimit,
      search: searchInput.value.trim(),
    };

    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    const res = await applicationService.getCompanyApplications(filters);
    allFetchedApps = res.data.applications;

    renderApplications(allFetchedApps);
    calculateLocalStats(allFetchedApps);
    updatePagination(allFetchedApps.length);
  } catch (error) {
    console.error('Load error:', error);
    container.innerHTML = `
            <div class="text-center py-10 text-red-500 bg-white rounded-xl border">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load applications.</p>
            </div>`;
  }
}

// D. Calculate Local Stats (No Changes)
function calculateLocalStats(apps) {
  let counts = { total: 0, new: 0, reviewing: 0, interviewed: 0, hired: 0 };
  counts.total = apps.length;

  apps.forEach((app) => {
    const s = app.status.toLowerCase();
    if (s === 'new' || s === 'submitted') counts.new++;
    else if (s === 'reviewing' || s === 'under_review') counts.reviewing++;
    else if (s === 'interviewed' || s === 'interview_scheduled')
      counts.interviewed++;
    else if (s === 'hired' || s === 'accepted') counts.hired++;
  });

  if (statTotal) statTotal.textContent = counts.total;
  if (statNew) statNew.textContent = counts.new;
  if (statReviewing) statReviewing.textContent = counts.reviewing;
  if (statInterviewed) statInterviewed.textContent = counts.interviewed;
  if (statHired) statHired.textContent = counts.hired;
}

// ============================================================
// 4. Rendering
// ============================================================
function renderApplications(apps) {
  if (apps.length === 0) {
    container.innerHTML = `
            <div class="text-center py-12 bg-white dark:bg-black/30 rounded-xl border border-gray-200 dark:border-gray-800">
                <div class="text-gray-400 mb-4"><i class="fas fa-users-slash text-5xl"></i></div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-200">No applications found</h3>
                <p class="text-gray-500 mt-1">No candidates match your search.</p>
            </div>
        `;
    return;
  }

  container.innerHTML = apps
    .map((app) => {
      const statusColor = getStatusBadgeColor(app.status);
      const date = new Date(app.appliedAt).toLocaleDateString();

      // Action Buttons Logic
      let actionsHtml = '';
      if (app.status === 'New' || app.status === 'submitted') {
        actionsHtml = `
                <button onclick="updateStatus('${app.id}', 'Reviewing')" class="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded hover:bg-yellow-200 border border-yellow-200 dark:bg-yellow-500/10 dark:hover:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-500/20 transition">Review</button>
                <button onclick="updateStatus('${app.id}', 'Rejected')" class="text-xs bg-white text-red-600 px-3 py-1.5 rounded border border-gray-200 hover:bg-red-50 dark:bg-red-900/30 dark:hover:bg-red-900/40 dark:border-red-900/60 dark:text-red-400 transition">Reject</button>
            `;
      } else if (app.status === 'Reviewing' || app.status === 'under_review') {
        actionsHtml = `
                <button onclick="updateStatus('${app.id}', 'Interviewed')" class="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200 border border-purple-200 dark:bg-purple-500/10 dark:hover:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500/20 transition">Interview</button>
                <button onclick="updateStatus('${app.id}', 'Rejected')" class="text-xs bg-white text-red-600 px-3 py-1.5 rounded border border-gray-200 hover:bg-red-50 dark:bg-red-900/30 dark:hover:bg-red-900/40 dark:border-red-900/60 dark:text-red-400 transition">Reject</button>
            `;
      } else if (
        app.status === 'Interviewed' ||
        app.status === 'interview_scheduled'
      ) {
        actionsHtml = `
                <button onclick="updateStatus('${app.id}', 'Hired')" class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 border border-green-200 dark:bg-green-500/10 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-500/20 transition font-bold"><i class="fas fa-check mr-1"></i> Hire</button>
                <button onclick="updateStatus('${app.id}', 'Rejected')" class="text-xs bg-white text-red-600 px-3 py-1.5 rounded border border-gray-200 hover:bg-red-50 dark:bg-red-900/30 dark:hover:bg-red-900/40 dark:border-red-900/60 dark:text-red-400 transition">Reject</button>
            `;
      } else {
        actionsHtml = `<span class="text-xs text-gray-400">No actions available</span>`;
      }

      return `
<div
  class="bg-white dark:bg-black/30 rounded-xl border border-gray-200 dark:border-slate-800 p-6 hover:shadow-md dark:hover:shadow-black/20 transition-shadow"
>
  <div class="flex flex-col md:flex-row justify-between gap-6">
    <div class="flex items-start gap-4">
      <div
        class="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-300 text-xl font-bold border border-gray-200 dark:border-slate-700"
      >
        ${app.candidateName.charAt(0).toUpperCase()}
      </div>

      <div>
        <div class="flex items-center gap-3 mb-1">
          <h3
            class="text-lg font-bold text-gray-900 dark:text-slate-100"
          >
            ${app.candidateName}
          </h3>

          <span
            class="${statusColor} px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide"
          >
            ${app.status}
          </span>
        </div>

        <p
          class="text-blue-600 dark:text-blue-400 text-sm font-medium mb-2"
        >
          ${app.position}
        </p>

        <div
          class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-slate-400"
        >
          <span class="flex items-center gap-1">
            <i class="far fa-envelope"></i> ${app.email}
          </span>

          <span class="flex items-center gap-1">
            <i class="fas fa-phone"></i> ${app.phone}
          </span>

          <span class="flex items-center gap-1">
            <i class="fas fa-briefcase"></i> ${app.experience}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          ${
            app.skills && app.skills.length > 0
              ? app.skills
                  .map(
                    (s) =>
                      `<span class="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs border border-gray-100 dark:border-slate-700">${s}</span>`
                  )
                  .join("")
              : '<span class="text-xs text-gray-400 dark:text-slate-500">No skills listed</span>'
          }
        </div>
      </div>
    </div>

    <div
      class="flex flex-col items-end justify-between gap-4 pl-4 border-l border-gray-100 dark:border-slate-800 min-w-[180px]"
    >
      <div class="text-right">
        <span
          class="text-xs text-gray-400 dark:text-slate-500 block mb-1"
        >
          Applied on ${date}
        </span>

        ${
          app.cvUrl
            ? `<a 
                href="${app.cvUrl}" 
                target="_blank" 
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-end gap-1 cursor-pointer transition-colors"
               >
                 <i class="fas fa-eye"></i> View CV
               </a>`
            : `<span class="text-sm text-gray-400 dark:text-slate-500 flex items-center justify-end gap-1 cursor-not-allowed" title="No CV Uploaded">
                 <i class="fas fa-eye-slash"></i> No CV
               </span>`
        }
      </div>

      <div class="flex gap-2 mt-auto">
        ${actionsHtml}
      </div>
    </div>
  </div>

  ${
    app.coverLetter && app.coverLetter.length > 10
      ? `
  <div class="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
      <p class="text-sm text-gray-500 dark:text-slate-400 italic line-clamp-2">
        "${app.coverLetter}"
      </p>
  </div>`
      : ""
  }
</div>
        `;
    })
    .join('');
}

function getStatusBadgeColor(status) {
  const s = status.toLowerCase();
  if (s === 'new' || s === 'submitted')
    return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20';
  if (s === 'reviewing' || s === 'under_review')
    return 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/20';
  if (s === 'interviewed' || s === 'interview_scheduled')
    return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20';
  if (s === 'hired' || s === 'accepted')
    return 'bg-green-50 text-green-600 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20';
  if (s === 'rejected') return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:border-red-900/60 dark:text-red-400';
  return 'bg-gray-50 text-gray-600';
}

function updatePagination(count) {
  pageInfo.textContent = `Page ${currentPage}`;
  if (count < currentLimit) {
    nextBtn.disabled = true;
    nextBtn.style.opacity = '0.5';
  } else {
    nextBtn.disabled = false;
    nextBtn.style.opacity = '1';
  }
  if (currentPage === 1) {
    prevBtn.disabled = true;
    prevBtn.style.opacity = '0.5';
  } else {
    prevBtn.disabled = false;
    prevBtn.style.opacity = '1';
  }
}

// ============================================================
// 5. Actions (Global)
// ============================================================

window.handleDownloadCV = (name) => {
  swalDarkConfig({
    icon: 'info',
    title: 'Coming Soon',
    text: `CV download feature for ${name} will be available in the next update!`,
    confirmButtonColor: '#3b82f6',
  });
};

window.updateStatus = async (id, newStatus) => {
  try {
    Toastify({
      text: 'Updating status...',
      backgroundColor: '#3b82f6',
    }).showToast();
    await applicationService.updateApplicationStatus(id, newStatus);
    Toastify({
      text: `Candidate moved to ${newStatus}`,
      backgroundColor: '#10B981',
    }).showToast();
    loadApplications();
  } catch (error) {
    console.error(error);
    swalDarkConfig({
      title:'Error',
      text:error.response?.data?.message || 'Failed to update status',
      icon:'error'
    });
  }
};

// Event Listeners (Only Search & Pagination)
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentPage = 1;
      loadApplications();
    }, 500);
  });
}

// 2. Pagination Buttons
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadApplications();
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    currentPage++;
    loadApplications();
  });
}

if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    authService.logout();
  });
}

  const mobileSidebar = document.getElementById('mobileSidebar');
  const openBtn = document.querySelector('.md\\:hidden'); // زرار البرجر في الـ Nav
  const closeBtn = document.getElementById('closeSidebar');
  const overlay = document.getElementById('closeSidebarOverlay');

  // فتح المنيو
  openBtn.onclick = () => {
    mobileSidebar.classList.remove('-translate-x-full');
  };

  // قفل المنيو
  const closeMenu = () => {
    mobileSidebar.classList.add('-translate-x-full');
  };

  closeBtn.onclick = closeMenu;
  overlay.onclick = closeMenu;

  // توجيه الروابط (نفس المنطق اللي عندك)
  document.querySelectorAll('#mobileSidebar li').forEach(item => {
    item.onclick = () => {
      const url = item.getAttribute('data-url');
      if (url) window.location.href = url;
    };
  });
