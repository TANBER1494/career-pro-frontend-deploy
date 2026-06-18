import { jobManagementService } from "../services/jobManagementService.js";
import { authService } from "../services/authService.js";
import Swal from "sweetalert2";
import Toastify from "toastify-js";

// DOM Elements
const jobsContainer = document.getElementById("jobsContainer");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("statusFilter");
const btnLogout = document.getElementById("btnLogout");

// Stats Elements
const statActive = document.getElementById("stat-active");
const statDraft = document.getElementById("stat-draft");
const statApps = document.getElementById("stat-apps");
const statViews = document.getElementById("stat-views");

// State
let allJobs = [];

// ============================================================
// 1. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadJobs();
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
// 2. Data Fetching
// ============================================================
async function loadJobs() {
  try {
    // Show Loading only on first load or full refresh
    if (jobsContainer.innerHTML.trim() === "") {
      jobsContainer.innerHTML =
        '<div class="text-center py-10 text-gray-500"><i class="fas fa-spinner fa-spin text-2xl"></i><p class="mt-2">Loading your jobs...</p></div>';
    }

    const res = await jobManagementService.getMyJobs();
    allJobs = res.data.jobs;

    renderJobs(allJobs);
    updateLocalStats(allJobs);
  } catch (error) {
    console.error("Error loading jobs:", error);
    jobsContainer.innerHTML = `
            <div class="text-center py-10 text-red-500">
                <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                <p>Failed to load jobs. Please try again.</p>
                <button onclick="location.reload()" class="mt-3 text-blue-600 underline">Reload</button>
            </div>`;
  }
}

function updateLocalStats(jobs) {
  if (statActive)
    statActive.textContent = jobs.filter(
      (j) => j.status === "published"
    ).length;
  if (statDraft)
    statDraft.textContent = jobs.filter((j) => j.status === "draft").length;
  // يمكنك إضافة منطق لحساب التطبيقات هنا إذا كانت البيانات متوفرة
}

// ============================================================
// 3. Rendering Logic
// ============================================================
function renderJobs(jobs) {
  if (jobs.length === 0) {
    jobsContainer.innerHTML = `
            <div
  class="text-center py-12 bg-white dark:bg-black/30 rounded-xl border border-gray-200 dark:border-slate-800"
>
  <div class="text-gray-300 dark:text-slate-600 mb-4">
    <i class="fas fa-briefcase text-5xl"></i>
  </div>

  <h3 class="text-lg font-medium text-gray-900 dark:text-slate-100">
    No jobs found
  </h3>

  <p class="text-gray-500 dark:text-slate-400 mt-1 mb-6">
    Get started by creating your first job posting.
  </p>

  <a
    href="/post_job"
    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm"
  >
    <i class="fas fa-plus mr-2"></i>
    Post New Job
  </a>
</div>
        `;
    return;
  }

  jobsContainer.innerHTML = jobs
    .map((job) => {
      const postedDate = new Date(job.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const expiryDate = new Date(
        new Date(job.createdAt).setDate(new Date(job.createdAt).getDate() + 30)
      ).toLocaleDateString();

      // Mapping DB status to UI Label
      let currentStatus = "Active";
      if (job.status === "draft") currentStatus = "Draft";
      if (job.status === "closed") currentStatus = "Closed";
      if (job.status === "archived") currentStatus = "Paused";

      return `
        <div
  class="bg-white dark:bg-black/30 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 p-6 group relative"
>
  <div class="flex flex-col md:flex-row justify-between gap-6">
    <div class="flex-1">
      <div class="flex items-center gap-3 mb-2">
        <h3
          class="text-xl font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
        >
          ${job.title}
        </h3>

        <div class="relative inline-block">
          <select
            onchange="handleStatusChange('${job._id}', this.value)"
            class="appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500 transition-colors dark:bg-black/40 dark:text-slate-200 dark:border-slate-700 ${getStatusColorClasses(
              currentStatus
            )}"
          >
            <option value="Active" ${
              currentStatus === "Active" ? "selected" : ""
            }>
              Active
            </option>

            <option value="Draft" ${
              currentStatus === "Draft" ? "selected" : ""
            }>
              Draft
            </option>

            <option value="Closed" ${
              currentStatus === "Closed" ? "selected" : ""
            }>
              Closed
            </option>

            <option value="Paused" ${
              currentStatus === "Paused" ? "selected" : ""
            }>
              Paused
            </option>
          </select>

          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current"
          >
            <i class="fas fa-chevron-down text-[10px]"></i>
          </div>
        </div>
      </div>

      <div
        class="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 dark:text-slate-400 mb-4"
      >
        <span class="flex items-center">
          <i
            class="fas fa-map-marker-alt mr-1.5 text-gray-400 dark:text-slate-500"
          ></i>
          ${job.location}
        </span>

        <span class="flex items-center">
          <i
            class="fas fa-briefcase mr-1.5 text-gray-400 dark:text-slate-500"
          ></i>
          ${job.type}
        </span>

        <span class="flex items-center">
          <i
            class="fas fa-money-bill-wave mr-1.5 text-gray-400 dark:text-slate-500"
          ></i>
          $${job.salaryMin.toLocaleString()} -
          $${job.salaryMax.toLocaleString()}
        </span>

        <span class="flex items-center">
          <i
            class="far fa-clock mr-1.5 text-gray-400 dark:text-slate-500"
          ></i>
          Posted ${postedDate}
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        ${job.skills
          .slice(0, 4)
          .map(
            (skill) =>
              `<span class="bg-gray-50 dark:bg-slate-900/50 text-gray-600 dark:text-slate-300 px-2 py-1 rounded text-xs border border-gray-100 dark:border-slate-700">${skill}</span>`
          )
          .join("")}
      </div>
    </div>

    <div
      class="flex flex-row md:flex-col justify-between items-end gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-800 md:pl-6 pt-4 md:pt-0 mt-4 md:mt-0"
    >
      <div class="text-right hidden md:block">
        <a
          href="/applications?jobId=${job._id}"
          class="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center justify-end gap-1"
        >
          View Applications
          <i class="fas fa-arrow-right text-xs"></i>
        </a>
      </div>

      <div class="flex items-center gap-2 w-full md:w-auto justify-end">
        <button
          onclick="handleEdit('${job._id}')"
          class="p-2 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition"
          title="Edit Job"
        >
          <i class="fas fa-pen"></i>
        </button>

        <button
          onclick="handleDelete('${job._id}')"
          class="p-2 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
          title="Delete Job"
        >
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  </div>
</div>
        `;
    })
    .join("");
}

function getStatusColorClasses(status) {
  switch (status) {
    case "Active":
      return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
    case "Draft":
      return "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
    case "Closed":
      return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
    case "Paused":
      return "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

// ============================================================
// 4. Global Actions (Status, Edit, Delete)
// ============================================================

// ✅ New Status Change Handler
window.handleStatusChange = async (id, newStatus) => {
  try {
    // Show mini loading toast
    Toastify({
      text: "Updating status...",
      backgroundColor: "#3b82f6", // Blue
      duration: 1000,
      gravity: "bottom",
      position: "right",
    }).showToast();

    await jobManagementService.updateJobStatus(id, newStatus);

    // Success Feedback
    Toastify({
      text: `Job is now ${newStatus}`,
      backgroundColor: "#10B981", // Green
      duration: 3000,
      gravity: "bottom",
      position: "right",
    }).showToast();

    // Refresh data to ensure sync (without full reload flicker)
    loadJobs();
  } catch (error) {
    console.error(error);
    swalDarkConfig({
      title: "Error",
      text: "Failed to update status.",
      icon: "error",
    });
    // Revert UI if possible (Reloading jobs fixes it)
    loadJobs();
  }
};

window.handleDelete = async (id) => {
  const result = await swalDarkConfig({
    title: "Delete Job?",
    text: "This will permanently remove the job posting and all associated applications.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it",
  });

  if (result.isConfirmed) {
    try {
      await jobManagementService.deleteJob(id);

      await swalDarkConfig({
        title: "Deleted!",
        text: "Job has been removed.",
        icon: "success",
      });

      loadJobs();
    } catch (error) {
      swalDarkConfig({
        title: "Error",
        text: "Failed to delete job.",
        icon: "error",
      });
    }
  }
};

window.handleEdit = (id) => {
  window.location.href = `/edit_job?id=${id}`;
};

// ============================================================
// 5. Filters
// ============================================================
function filterJobs() {
  const term = searchInput.value.toLowerCase();
  const status = statusFilter.value; // 'all', 'published', 'draft', 'closed'

  const filtered = allJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(term) ||
      job.location.toLowerCase().includes(term);
    const matchesStatus = status === "all" || job.status === status;
    return matchesSearch && matchesStatus;
  });

  renderJobs(filtered);
}

searchInput.addEventListener("input", filterJobs);
statusFilter.addEventListener("change", filterJobs);

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
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
