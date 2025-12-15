import { seekerService } from "../services/seekerService.js";
import { jobService } from "../services/jobService.js";
import { authService } from "../services/authService.js";
import Swal from "sweetalert2";

// ============================================================
// 1. Elements & State
// ============================================================
const viewMode = document.getElementById("viewMode");
const editMode = document.getElementById("editMode");
const loadingState = document.getElementById("loadingState");

const btnEditProfile = document.getElementById("btnEditProfile");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const btnSaveChanges = document.getElementById("btnSaveChanges");
const btnLogout = document.getElementById("btnLogout");

const savedJobsContainer = document.getElementById("savedJobsContainer");
const applicationsContainer = document.getElementById("applicationsContainer");
const savedCountBadge = document.getElementById("savedCount");
const appsCountBadge = document.getElementById("appsCount");

let currentProfile = {};

// ============================================================
// 2. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  init();
});

async function init() {
  setupProfileTabs();
  initModalEvents();

  if (loadingState) loadingState.classList.remove("hidden");
  if (viewMode) viewMode.classList.add("hidden");

  try {
    await Promise.all([loadProfileData(), loadApplications(), loadSavedJobs()]);
  } catch (error) {
    console.error("Partial Error loading data", error);
  }

  if (loadingState) loadingState.classList.add("hidden");
  if (viewMode) viewMode.classList.remove("hidden");
}

// ============================================================
// Logic: Tabs Navigation
// ============================================================
function setupProfileTabs() {
  const tabs = document.querySelectorAll(".profile-tab-btn");
  const contents = document.querySelectorAll(".profile-tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      tabs.forEach((t) => {
        t.classList.remove(
          "active",
          "text-blue-600",
          "border-b-2",
          "border-blue-600"
        );
        t.classList.add("text-slate-500");
      });
      contents.forEach((c) => {
        c.classList.add("hidden");
        c.classList.remove("block");
      });
      tab.classList.add(
        "active",
        "text-blue-600",
        "border-b-2",
        "border-blue-600"
      );
      tab.classList.remove("text-slate-500");

      const targetId = tab.dataset.target;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.remove("hidden");
        targetContent.classList.add("block");
      }
    });
  });
}

// ============================================================
// Logic: Load Profile Data
// ============================================================
async function loadProfileData() {
  try {
    const res = await seekerService.getMe();
    const backendData = res.data || {};
    const personal = backendData.personal || {};
    const education = backendData.education || {};
    const cv = backendData.cv || {};
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");

    let finalName = personal.fullName;
    if (!finalName && (localUser.firstName || localUser.lastName)) {
      finalName = `${localUser.firstName || ""} ${
        localUser.lastName || ""
      }`.trim();
    }

    currentProfile = {
      fullName: finalName || "User",
      firstName: localUser.firstName,
      lastName: localUser.lastName,
      email: localUser.email || personal.email,
      phoneNumber: personal.phoneNumber || personal.phone,
      jobTitle: personal.jobTitle,
      summary: personal.summary,
      country: personal.country,
      city: personal.city,
      experienceLevel: personal.experienceLevel,
      yearsOfExperience: personal.yearsOfExperience,
      industry: personal.industry,
      birthDate: personal.birthDate,
      gender: personal.gender,
      degree: education.degree,
      university: education.university,
      graduationYear: education.graduationYear,
      gpa: education.gpa,
      jobType: education.jobType || education.workType,
      workplaceSetting: education.workplaceSetting || education.workPlace,
      cvName: cv.fileName,
      cvUrl: cv.cvUrl,
    };

    renderViewMode(currentProfile);
  } catch (error) {
    console.error("Load Profile Error:", error);
  }
}

function renderViewMode(data) {
  if (!data) return;
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val && val !== "undefined" ? val : "--";
  };

  setText("view-fullName", data.fullName);
  const initials = (data.fullName || "ME")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  setText("view-initials", initials);
  setText("view-industry", data.jobTitle || data.industry || "Job Seeker");
  setText(
    "view-location",
    data.city || data.country
      ? `${data.city || ""}, ${data.country || ""}`
      : "--"
  );
  setText("view-email", data.email);
  setText("view-phone", data.phoneNumber);
  setText("view-degree", data.degree);
  setText("view-university", data.university);
  setText("view-gradYear", data.graduationYear);
  setText("view-gpa", data.gpa);
  if (data.gpa)
    document.getElementById("view-gpa-container")?.classList.remove("hidden");
  setText("view-expLevel", data.experienceLevel);
  setText("view-yearsExp", data.yearsOfExperience);
  setText("view-industryDetail", data.industry);
  setText(
    "view-birthDate",
    data.birthDate ? new Date(data.birthDate).toLocaleDateString() : "--"
  );
  setText("view-gender", data.gender);
  setText("view-country", data.country);
  setText("view-jobType", data.jobType);
  setText("view-workplace", data.workplaceSetting);
  setText("view-cvName", data.cvName || "No CV uploaded");
  const cvLink = document.getElementById("view-cvLink");
  if (cvLink && data.cvUrl) {
    cvLink.href = data.cvUrl.startsWith("http")
      ? data.cvUrl
      : `http://localhost:3000${data.cvUrl}`;
  }
}

// ============================================================
// Logic: Load Applications (Tab 2) - WITH DELETE
// ============================================================
async function loadApplications() {
  if (!applicationsContainer) return;
  try {
    const res = await seekerService.getMyApplications();
    const apps = res.data.applications || [];

    if (appsCountBadge) appsCountBadge.textContent = `${apps.length} Applied`;

    if (apps.length === 0) {
      applicationsContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
            <i class="fas fa-file-signature text-6xl text-slate-200 mb-4"></i>
            <p class="text-slate-500 font-medium">No applications sent yet</p>
            <a href="/src/pages/public jobs/jobs.html" class="mt-3 text-blue-600 text-sm font-medium hover:underline">Find Jobs</a>
        </div>`;
      return;
    }

    applicationsContainer.innerHTML = apps
      .map((app) => createApplicationCard(app))
      .join("");
  } catch (error) {
    console.error("Apps Error:", error);
    applicationsContainer.innerHTML = `<p class="text-center text-red-400">Failed to load applications.</p>`;
  }
}

function createApplicationCard(app) {
  let statusClass = "bg-gray-100 text-gray-600";
  let statusIcon = "fa-clock";
  const statusLower = (app.status || "").toLowerCase();

  // Status Logic
  if (statusLower === "submitted" || statusLower === "new") {
    statusClass = "bg-blue-50 text-blue-600 border-blue-100";
    statusIcon = "fa-paper-plane";
  } else if (statusLower === "viewed" || statusLower === "reviewing") {
    statusClass = "bg-yellow-50 text-yellow-600 border-yellow-100";
    statusIcon = "fa-eye";
  } else if (statusLower === "interview") {
    statusClass = "bg-purple-50 text-purple-600 border-purple-100";
    statusIcon = "fa-user-tie";
  } else if (statusLower === "accepted" || statusLower === "hired") {
    statusClass = "bg-green-50 text-green-600 border-green-100";
    statusIcon = "fa-check-circle";
  } else if (statusLower === "rejected") {
    statusClass = "bg-red-50 text-red-600 border-red-100";
    statusIcon = "fa-times-circle";
  }

  const title = app.jobTitle || "Unknown Position";
  const company = app.companyName || "Unknown Company";
  const location = app.location || "Remote";
  const date = app.appliedAt
    ? new Date(app.appliedAt).toLocaleDateString()
    : "Recent";
  const appId = app.id || app._id;

  let logoHtml = `<span class="text-blue-500 font-bold text-xl">${company
    .charAt(0)
    .toUpperCase()}</span>`;
  if (app.companyLogo && !app.companyLogo.includes("url...")) {
    const logoSrc = app.companyLogo.startsWith("http")
      ? app.companyLogo
      : app.companyLogo;
    logoHtml = `<img src="${logoSrc}" alt="${company}" class="w-full h-full object-cover">`;
  }

  // 🔥 الشرط: إظهار زر الحذف فقط لو الحالة Rejected أو Hired/Accepted
  const canDelete = ["rejected", "hired", "accepted"].includes(statusLower);

  return `
    <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all duration-300 group w-full" id="app-card-${appId}">
        
        <div class="flex items-center gap-4 w-full sm:w-auto">
            <div class="w-14 h-14 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden">
                 ${logoHtml}
            </div>
            <div>
                <h4 class="font-bold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">${title}</h4>
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                    <span class="font-medium text-slate-700 flex items-center gap-1"><i class="fa-regular fa-building"></i> ${company}</span>
                    <span class="hidden sm:inline text-slate-300">|</span>
                    <span class="flex items-center gap-1"><i class="fa-solid fa-location-dot"></i> ${location}</span>
                    <span class="hidden sm:inline text-slate-300">|</span>
                    <span class="flex items-center gap-1"><i class="fa-regular fa-calendar"></i> ${date}</span>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto justify-end mt-2 sm:mt-0">
             <span class="px-3 py-1.5 rounded-lg text-xs font-bold border ${statusClass} flex items-center gap-2 shadow-sm capitalize">
                <i class="fas ${statusIcon}"></i> ${statusLower}
            </span>

            ${
              canDelete
                ? `
            <button onclick="deleteApplication('${appId}')" 
                    class="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 text-red-500 bg-red-50 hover:bg-red-100 hover:border-red-200 transition-colors" 
                    title="Remove Application">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
            `
                : ""
            }
        </div>
    </div>
    `;
}

// ============================================================
// Logic: Load Saved Jobs
// ============================================================
async function loadSavedJobs() {
  if (!savedJobsContainer) return;
  try {
    const res = await jobService.getSavedJobs();
    const jobs = res.data.jobs || res.data.savedJobs || [];
    if (savedCountBadge) savedCountBadge.textContent = `${jobs.length} Saved`;
    if (jobs.length === 0) {
      savedJobsContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
            <i class="fas fa-bookmark text-7xl text-slate-200 mb-4"></i>
            <p class="text-slate-500 font-medium">No saved jobs yet</p>
            <a href="/src/pages/public jobs/jobs.html" class="mt-3 text-blue-600 text-sm font-medium hover:underline">Explore Jobs</a>
        </div>`;
      return;
    }
    savedJobsContainer.innerHTML = jobs
      .map((job) => createSavedJobCard(job))
      .join("");
  } catch (error) {
    savedJobsContainer.innerHTML = `<p class="text-center text-red-400">Failed to load saved jobs.</p>`;
  }
}

function createSavedJobCard(job) {
  const jobId = job.id || job._id;
  const companyData = job.companyId || job.company || {};
  const companyName = companyData.companyName || companyData.name || "Company";
  let logo = "https://placehold.co/64x64?text=Job";
  if (companyData.logo && !companyData.logo.includes("url..."))
    logo = companyData.logo;
  const location = job.location || companyData.location || "Remote";
  const type = job.type || "Full-time";

  return `
    <div class="group relative w-full bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" id="saved-card-${jobId}">
        <div class="flex items-center gap-4 w-full sm:w-auto">
            <div class="w-14 h-14 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden">
                <img src="${logo}" alt="${companyName}" class="w-full h-full object-cover">
            </div>
            <div>
                <h4 class="font-bold text-slate-800 text-base leading-tight cursor-pointer hover:text-blue-600 transition-colors" onclick="window.location.href='/job-details.html?id=${jobId}'">
                    ${job.title}
                </h4>
                <div class="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                    <span class="font-medium text-slate-700 flex items-center gap-1"><i class="fa-regular fa-building"></i> ${companyName}</span>
                    <span class="hidden sm:inline text-slate-300">|</span>
                    <span class="flex items-center gap-1"><i class="fa-solid fa-location-dot"></i> ${location}</span>
                    <span class="hidden sm:inline text-slate-300">|</span>
                    <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">${type}</span>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto justify-end mt-2 sm:mt-0">
            <button onclick="openApplyModal('${jobId}')" class="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200">Apply Now</button>
            <button onclick="removeSavedJob('${jobId}')" class="px-3 py-2 border border-red-100 text-red-500 bg-red-50 hover:bg-red-100 hover:border-red-200 rounded-lg transition-colors"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    </div>`;
}

// ============================================================
// Edit Mode Logic
// ============================================================
function toggleView(showEdit) {
  if (showEdit) {
    viewMode.classList.add("hidden");
    editMode.classList.remove("hidden");
  } else {
    editMode.classList.add("hidden");
    viewMode.classList.remove("hidden");
  }
}
if (btnEditProfile)
  btnEditProfile.addEventListener("click", () => {
    populateEditForm(currentProfile);
    toggleView(true);
  });
if (btnCancelEdit)
  btnCancelEdit.addEventListener("click", () => toggleView(false));

function populateEditForm(data) {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };
  setVal("input-fullName", data.fullName);
  setVal("input-phoneNumber", data.phoneNumber);
  if (data.birthDate) {
    try {
      setVal(
        "input-birthDate",
        new Date(data.birthDate).toISOString().split("T")[0]
      );
    } catch (e) {}
  }
  setVal("input-gender", data.gender);
  setVal("input-country", data.country);
  setVal("input-city", data.city);
  setVal("input-experienceLevel", data.experienceLevel);
  setVal("input-yearsOfExperience", data.yearsOfExperience);
  setVal("input-industry", data.industry);
  setVal("input-degree", data.degree);
  setVal("input-university", data.university);
  setVal("input-graduationYear", data.graduationYear);
  setVal("input-gpa", data.gpa);
  setVal("input-jobType", data.jobType);
  setVal("input-workplaceSetting", data.workplaceSetting);
}

btnSaveChanges.addEventListener("click", async (e) => {
  e.preventDefault();
  const getVal = (id) => document.getElementById(id)?.value.trim() || "";
  const updatedData = {
    fullName: getVal("input-fullName"),
    phoneNumber: getVal("input-phoneNumber"),
    birthDate: getVal("input-birthDate"),
    gender: getVal("input-gender"),
    yearsOfExperience: Number(getVal("input-yearsOfExperience")) || 0,
    experienceLevel: getVal("input-experienceLevel"),
    industry: getVal("input-industry"),
    country: getVal("input-country"),
    city: getVal("input-city"),
    degree: getVal("input-degree"),
    university: getVal("input-university"),
    graduationYear: Number(getVal("input-graduationYear")) || null,
    gpa: Number(getVal("input-gpa")) || null,
    jobType: getVal("input-jobType"),
    workplaceSetting: getVal("input-workplaceSetting"),
  };

  try {
    btnSaveChanges.disabled = true;
    btnSaveChanges.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Saving...';
    await seekerService.updateProfile(updatedData);
    Swal.fire({
      icon: "success",
      title: "Profile Updated",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      loadProfileData();
      toggleView(false);
    });
  } catch (error) {
    Swal.fire("Error", "Failed to update profile.", "error");
  } finally {
    btnSaveChanges.disabled = false;
    btnSaveChanges.innerHTML = "Save Changes";
  }
});

// ============================================================
// Global Helpers
// ============================================================
if (btnLogout) btnLogout.addEventListener("click", () => authService.logout());

window.openApplyModal = function (jobId) {
  const modal = document.getElementById("applyModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.dataset.jobId = jobId;
    if (currentProfile) {
      document.getElementById("applyName").value =
        currentProfile.fullName || "";
      document.getElementById("applyEmail").value = currentProfile.email || "";
      document.getElementById("applyPhone").value =
        currentProfile.phoneNumber || "";
    }
  }
};

window.removeSavedJob = async function (jobId) {
  const result = await Swal.fire({
    title: "Remove?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Yes",
  });
  if (result.isConfirmed) {
    await jobService.toggleSaveJob(jobId);
    document.getElementById(`saved-card-${jobId}`)?.remove();
    if (savedCountBadge)
      savedCountBadge.textContent = `${
        parseInt(savedCountBadge.textContent) - 1
      } Saved`;
    if (savedJobsContainer.children.length === 0) loadSavedJobs();
    Swal.fire("Removed!", "", "success");
  }
};

// ✅ FIX: دالة الحذف الجديدة للطلبات
window.deleteApplication = async function (appId) {
  const result = await Swal.fire({
    title: "Delete Application?",
    text: "This will remove it from your history. Are you sure?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Yes, delete it",
  });

  if (result.isConfirmed) {
    try {
      await seekerService.deleteApplication(appId);
      document.getElementById(`app-card-${appId}`)?.remove();
      if (appsCountBadge)
        appsCountBadge.textContent = `${
          parseInt(appsCountBadge.textContent) - 1
        } Applied`;
      if (applicationsContainer.children.length === 0) loadApplications();
      Swal.fire("Deleted!", "Application history removed.", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to delete application.", "error");
    }
  }
};

function initModalEvents() {
  const modal = document.getElementById("applyModal");
  const closeBtn = document.getElementById("btnCloseModal");
  let form = document.getElementById("applyForm");

  const close = () => {
    modal?.classList.add("hidden");
    form?.reset();
  };
  closeBtn?.addEventListener("click", close);
  document.getElementById("btnCancelModal")?.addEventListener("click", close);
  window.onclick = (e) => {
    if (e.target === modal) close();
  };

  if (form) {
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    newForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = newForm.querySelector('button[type="submit"]');
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Sending...";
        const data = {
          fullName: document.getElementById("applyName").value,
          email: document.getElementById("applyEmail").value,
          phone: document.getElementById("applyPhone").value,
          cvFile: document.getElementById("applyCv").files[0],
          coverLetter: document.getElementById("applyCover").value,
        };
        await jobService.applyForJob(modal.dataset.jobId, data);
        Swal.fire("Success", "Application Sent!", "success");
        close();
      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || "Failed", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Submit";
      }
    });
  }
}
