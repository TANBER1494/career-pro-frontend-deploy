import { jobService } from "../services/jobService.js";
import { authService } from "../services/authService.js";
import Swal from "sweetalert2";

// ============================================================
// 1. Elements & State
// ============================================================
const container = document.getElementById("jobs-container");
const countLabel = document.getElementById("jobs-count");

// Filters
const searchInput = document.getElementById("search-input");
const filterLocation = document.getElementById("filter-location");
const filterType = document.getElementById("filter-type");
const btnFilter = document.getElementById("btn-filter");
const filterExperience = document.getElementById("filter-experience");

// State
let allFetchedJobs = [];
let currentFilters = {
  search: "",
  location: "",
  experienceLevel: "",
  type: "",
  page: 1,
  limit: 500, // نجلب عدد كبير لتقسيمه في الفرونت
};

const itemsPerPage = 12;
let searchTimeout = null;

// ============================================================
// 2. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Check URL Params
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");

  if (searchParam) {
    currentFilters.search = searchParam;
    if (searchInput) searchInput.value = searchParam;
  }

  // 2. Create Pagination Elements if missing
  ensurePaginationHTML();

  // 3. Load Initial Data
  loadJobs();

  // 4. Setup Events
  setupEventListeners();
  initModalEvents();
});

function ensurePaginationHTML() {
  let pagContainer = document.getElementById("pagination-container");
  if (!pagContainer && container) {
    pagContainer = document.createElement("div");
    pagContainer.id = "pagination-container";
    pagContainer.className =
      "flex justify-center items-center gap-4 mt-12 mb-8";
    container.parentNode.appendChild(pagContainer);
  }
}

// ============================================================
// 3. Logic: Fetch Jobs (With Saved Status Check)
// ============================================================
async function loadJobs() {
  if (!container) return;

  // Show Loading State
  container.innerHTML = `
        <div class="col-span-full text-center py-20">
            <i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
            <p class="mt-4 text-slate-500 font-medium">Finding the best opportunities for you...</p>
        </div>
    `;

  try {
    // Clean filters
    const params = { ...currentFilters };
    if (!params.search) delete params.search;
    if (!params.location || params.location === "All Locations")
      delete params.location;
    if (!params.type || params.type === "All Types") delete params.type;
    if (!params.experienceLevel) delete params.experienceLevel;

    // Always request page 1 from API to get the full batch
    params.page = 1;

    // 1. جلب الوظائف العامة
    const response = await jobService.getAllJobs(params);
    let jobs = response.data.jobs || [];

    // 2. 🔥 التحقق من حالة الحفظ (للمستخدم المسجل فقط)
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // نجلب الوظائف المحفوظة
        const savedResponse = await jobService.getSavedJobs();
        const savedJobs = savedResponse.data.jobs || [];

        // ننشئ Set تحتوي على IDs الوظائف المحفوظة لسهولة البحث
        const savedIds = new Set(savedJobs.map((j) => j._id || j.id));

        // نعدل مصفوفة الوظائف الأصلية
        jobs = jobs.map((job) => ({
          ...job,
          // لو الـ ID موجود في المحفوظات، يبقى isSaved = true
          isSaved: savedIds.has(job._id || job.id),
        }));
      } catch (err) {
        console.warn("Failed to sync saved status", err);
        // نكمل عادي حتى لو فشل جلب المحفوظات
      }
    }

    // تخزين الوظائف في المتغير العام
    allFetchedJobs = jobs;

    // Update Count
    if (countLabel) {
      countLabel.textContent = `Showing ${allFetchedJobs.length} results`;
    }

    // استدعاء دالة العرض
    renderJobs();

    // تحديث زراير الصفحات
    updatePaginationUI(allFetchedJobs.length);
  } catch (error) {
    console.error("All Jobs Error:", error);
    container.innerHTML = `
            <div class="col-span-full text-center py-20">
                <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                <p class="text-slate-500">Failed to load jobs. Please try again later.</p>
                <button onclick="window.location.reload()" class="mt-4 text-blue-600 font-medium hover:underline">Retry</button>
            </div>
        `;
  }
}

// ============================================================
// 4. Logic: Render Cards (With Pagination Slice)
// ============================================================
function renderJobs() {
  container.innerHTML = "";
  const jobs = allFetchedJobs;

  if (jobs.length === 0) {
    container.innerHTML = `
            <div class="col-span-full text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <i class="fas fa-search text-slate-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-medium text-slate-900">No jobs found</h3>
                <p class="text-slate-500 text-sm mt-1">Try adjusting your search keywords or filters.</p>
                <button onclick="window.location.href='/jobs.html'" class="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition">Clear Filters</button>
            </div>
        `;
    const pagContainer = document.getElementById("pagination-container");
    if (pagContainer) pagContainer.innerHTML = "";
    return;
  }

  const start = (currentFilters.page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const jobsToShow = jobs.slice(start, end);

  jobsToShow.forEach((job) => {
    container.insertAdjacentHTML("beforeend", createJobCard(job));
  });
}

// دوال التحكم في الـ Pagination
function updatePaginationUI(totalItems) {
  const pagContainer = document.getElementById("pagination-container");
  if (!pagContainer) return;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const isFirstPage = currentFilters.page === 1;
  const isLastPage = currentFilters.page >= totalPages;

  if (totalPages <= 1) {
    pagContainer.innerHTML = "";
    return;
  }

  pagContainer.innerHTML = `
        <button id="prevBtn" 
            class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            ${isFirstPage ? "disabled" : ""}>
            <i class="fas fa-chevron-left mr-1"></i> Previous
        </button>
        
        <span class="text-sm text-slate-600 font-medium px-2">
            Page ${currentFilters.page} of ${totalPages}
        </span>

        <button id="nextBtn" 
            class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            ${isLastPage ? "disabled" : ""}>
            Next <i class="fas fa-chevron-right ml-1"></i>
        </button>
    `;

  document
    .getElementById("prevBtn")
    ?.addEventListener("click", () => changePage(-1));
  document
    .getElementById("nextBtn")
    ?.addEventListener("click", () => changePage(1));
}

function changePage(direction) {
  currentFilters.page += direction;
  if (currentFilters.page < 1) currentFilters.page = 1;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderJobs();
  updatePaginationUI(allFetchedJobs.length);
}

function createJobCard(job) {
  const timeAgo = getTimeAgo(job.postedAt || job.createdAt);

  // ============================================================
  // 🔥 FIX: التعامل الذكي مع بيانات الشركة
  // ============================================================
  const companyData = job.companyId || job.company || {};
  const companyName =
    companyData.companyName || companyData.name || "Confidential Company";

  let companyLogo = "https://placehold.co/48x48?text=Logo";
  const rawLogo = companyData.logo || companyData.logoUrl;
  if (rawLogo && !rawLogo.includes("url...") && rawLogo.length > 10) {
    companyLogo = rawLogo;
  }

  const location = job.location || companyData.location || "Remote";
  const companyLinkId = companyData._id || companyData.id;
  // ============================================================

  const type = job.type || "Full-time";

  // ✅ أيقونة الحفظ المتزامنة
  const saveIconClass = job.isSaved
    ? "fa-solid text-blue-600"
    : "fa-regular text-slate-400";

  const featuredBadge = job.isFeatured
    ? `<span class="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-semibold font-poppins px-3 py-1 rounded-bl-lg rounded-tr-lg uppercase tracking-wider z-10">Featured</span>`
    : "";

  const skillsHTML = (job.skills || [])
    .slice(0, 3)
    .map(
      (skill) =>
        `<span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">${skill}</span>`
    )
    .join("");

  const jobLink = `/job-details.html?id=${job.id || job._id}`;
  const companyLink = companyLinkId
    ? `/company-details.html?id=${companyLinkId}`
    : "#";

  return `
    <div class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative group border border-slate-200 flex flex-col h-full text-left">
        
        ${featuredBadge}
        
        <button onclick="window.toggleSaveJob('${
          job.id || job._id
        }', this)" class="absolute top-5 right-5 hover:text-blue-600 transition-colors z-20 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50" title="Save Job">
            <i class="${saveIconClass} fa-bookmark text-lg"></i>
        </button>

        <div class="flex items-start gap-4 mb-3">
            <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden shrink-0 border border-blue-100 p-1">
                <img src="${companyLogo}" alt="${companyName}" class="w-full h-full object-cover rounded-md">
            </div>
            <div>
                <h3 class="font-medium font-poppins text-slate-900 leading-tight line-clamp-1 hover:text-blue-600 cursor-pointer" onclick="window.location.href='${jobLink}'">
                    ${job.title}
                </h3>
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span class="font-medium text-slate-700 hover:text-blue-600 cursor-pointer transition-colors" onclick="window.location.href='${companyLink}'">
                        <i class="fa-regular fa-building mr-1"></i> ${companyName}
                    </span>
                    <span><i class="fa-solid fa-location-dot mr-1"></i> ${location}</span>
                </div>
            </div>
        </div>

        <p class="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed flex-grow">
            ${job.description || "No description provided."}
        </p>

        <div class="flex flex-wrap gap-2 mb-4 h-12 overflow-hidden content-start">
            ${skillsHTML}
        </div>

        <div class="flex items-center justify-between mb-4 mt-auto border-t border-slate-50 pt-3">
            <span class="text-green-600 font-semibold font-poppins text-xs">${
              job.salaryRange || "Competitive"
            }</span>
            <span class="text-slate-400 text-xs flex items-center gap-1"><i class="fa-regular fa-clock"></i> ${timeAgo}</span>
        </div>

        <div class="flex items-center gap-2">
            <span class="px-3 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 bg-slate-50">
                ${type}
            </span>
            <button onclick="window.applyForJobCheck('${
              job.id || job._id
            }')" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-blue-500/20 shadow-sm ml-auto text-center">
                Apply Now
            </button>
        </div>
    </div>
    `;
}

// ============================================================
// 5. Logic: Event Listeners
// ============================================================
function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value.trim();
        currentFilters.page = 1;
        loadJobs();
      }, 500);
    });
  }

  const handleFilterChange = (key, value) => {
    currentFilters[key] = value;
    currentFilters.page = 1;
    loadJobs();
  };

  if (filterLocation) {
    filterLocation.addEventListener("change", (e) =>
      handleFilterChange("location", e.target.value)
    );
  }

  if (filterType) {
    filterType.addEventListener("change", (e) =>
      handleFilterChange("type", e.target.value)
    );
  }
  if (filterExperience) {
    filterExperience.addEventListener("change", (e) =>
      handleFilterChange("experienceLevel", e.target.value)
    );
  }
  if (btnFilter) {
    btnFilter.addEventListener("click", () => loadJobs());
  }
}

// ============================================================
// 6. Global Actions (Apply, Save, Modal)
// ============================================================

window.applyForJobCheck = function (jobId) {
  const token = localStorage.getItem("token");

  if (!token) {
    Swal.fire({
      icon: "info",
      title: "Login Required",
      text: "You need to login to apply for jobs.",
      showCancelButton: true,
      confirmButtonText: "Login Now",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed)
        window.location.href = "/src/pages/auth/signup-login.html";
    });
    return;
  }

  const modal = document.getElementById("applyModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.dataset.jobId = jobId;

    // Pre-fill Name/Email from local storage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const nameInput = document.getElementById("applyName");
    const emailInput = document.getElementById("applyEmail");

    if (nameInput && user.firstName)
      nameInput.value = `${user.firstName} ${user.lastName || ""}`.trim();
    if (emailInput && user.email) emailInput.value = user.email;
  }
};

window.toggleSaveJob = async function (jobId, btnElement) {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire("Login Required", "Please login to save jobs.", "info");
    return;
  }

  try {
    const icon = btnElement.querySelector("i");
    const isSaved = icon.classList.contains("fa-solid");

    // Optimistic UI
    if (isSaved) {
      icon.classList.remove("fa-solid", "text-blue-600");
      icon.classList.add("fa-regular", "text-slate-400");
    } else {
      icon.classList.remove("fa-regular", "text-slate-400");
      icon.classList.add("fa-solid", "text-blue-600");
    }

    await jobService.toggleSaveJob(jobId);
  } catch (error) {
    console.error("Save Error:", error);
    Swal.fire("Error", "Failed to save job.", "error");
  }
};

window.closeApplyModal = function () {
  document.getElementById("applyModal").classList.add("hidden");
};

// ============================================================
// Modal & Apply Logic (Fixed Double Submission)
// ============================================================
function initModalEvents() {
  const modal = document.getElementById("applyModal");
  const closeBtn = document.getElementById("btnCloseModal");
  const cancelBtn = document.getElementById("btnCancelModal");

  let form = document.getElementById("applyForm");

  const close = () => {
    if (modal) modal.classList.add("hidden");
    if (form) form.reset();
  };

  if (closeBtn) closeBtn.onclick = close;
  if (cancelBtn) cancelBtn.onclick = close;

  window.onclick = (e) => {
    if (e.target === modal) close();
  };

  if (form) {
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    form = newForm;

    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const jobId = modal.dataset.jobId;
      const fileInput = document.getElementById("applyCv");
      const nameInput = document.getElementById("applyName");
      const emailInput = document.getElementById("applyEmail");
      const phoneInput = document.getElementById("applyPhone");
      const coverInput = document.getElementById("applyCover");

      if (!fileInput.files || fileInput.files.length === 0) {
        Swal.fire("Warning", "Please upload your CV.", "warning");
        return;
      }

      const applyData = {
        fullName: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        cvFile: fileInput.files[0],
        coverLetter: coverInput.value,
      };

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }

        await jobService.applyForJob(jobId, applyData);

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Application submitted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });

        close();
      } catch (error) {
        console.error("Apply Error Details:", error);
        let errorMsg = "Failed to submit application.";
        if (error.response && error.response.status === 409) {
          errorMsg = "You have already applied for this job.";
        } else if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          errorMsg = error.response.data.message;
        }
        Swal.fire({
          icon: "error",
          title: "Application Failed",
          text: errorMsg,
        });
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = "Submit Application";
        }
      }
    });
  }
}

function getTimeAgo(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  return "Just now";
}
