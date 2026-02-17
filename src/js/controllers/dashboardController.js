import { jobManagementService } from "../services/jobManagementService.js";
import { applicationService } from "../services/applicationService.js"; // ✅ إضافة جديدة
import { authService } from "../services/authService.js";
import Toastify from "toastify-js";

// ============================================================
// 1. Elements
// ============================================================
const companyNameEl = document.getElementById("companyName");
const verificationAlert = document.getElementById("verificationAlert");
const verifStatusBadge = document.getElementById("verifStatusBadge");
const verifProgressText = document.getElementById("verifProgressText");

const recentJobsContainer = document.getElementById("recentJobsContainer");
const recentAppsContainer = document.getElementById("recentAppsContainer");
const btnLogout = document.getElementById("btnLogout");

// ============================================================
// 2. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();
});

// ============================================================
// 3. Data Fetching
// ============================================================
async function loadDashboardData() {
  try {
    // أ) جلب إحصائيات الشركة والوظائف (من Endpoint الداشبورد)
    const statsRes = await jobManagementService.getCompanyStats();
    const statsData = statsRes.data;

    // تحديث الهيدر وحالة التوثيق والوظائف
    companyNameEl.textContent = statsData.companyName || "Company";
    renderVerificationStatus(statsData.verificationStatus);
    renderRecentJobs(statsData.recentJobs);

    // ب) جلب أحدث المتقدمين (استدعاء منفصل من Endpoint التطبيقات) ✅ الحل هنا
    // نطلب أحدث 5 متقدمين فقط
    const appsRes = await applicationService.getCompanyApplications({
      limit: 5,
      page: 1,
    });
    renderRecentApplications(appsRes.data.applications);
  } catch (error) {
    console.error("Dashboard Error:", error);
    Toastify({
      text: "Failed to load dashboard data",
      backgroundColor: "#ef4444",
    }).showToast();
  }
}

// ============================================================
// 4. Rendering Logic
// ============================================================

function renderVerificationStatus(status) {
  if (status === "verified") {
    verificationAlert.classList.add("hidden");
    return;
  }

  verificationAlert.classList.remove("hidden");

  verifStatusBadge.className =
    "px-3 py-1 rounded-full text-xs font-bold border uppercase";

  switch (status) {
    case "pending":
    case "in_progress":
      verifStatusBadge.textContent = "Pending Review";
      verifStatusBadge.classList.add(
        "bg-yellow-100",
        "text-yellow-700",
        "border-yellow-200"
      );
      verifProgressText.textContent = "Under Review";
      break;
    case "rejected":
      verifStatusBadge.textContent = "Rejected";
      verifStatusBadge.classList.add(
        "bg-red-100",
        "text-red-700",
        "border-red-200"
      );
      verifProgressText.textContent = "Action Required";
      break;
    default: // unverified
      verifStatusBadge.textContent = "Unverified";
      verifStatusBadge.classList.add(
        "bg-gray-100",
        "text-gray-600",
        "border-gray-200"
      );
      verifProgressText.textContent = "Start Verification";
  }
}

function renderRecentJobs(jobs) {
  if (!jobs || jobs.length === 0) {
    recentJobsContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500 text-sm">
                <i class="fas fa-briefcase mb-2 text-2xl opacity-50"></i>
                <p>No active jobs yet.</p>
                <a href="/post_job" class="text-blue-600 hover:text-blue-700 mt-1 block">Post a job</a>
            </div>
        `;
    return;
  }

  recentJobsContainer.innerHTML = jobs
    .map((job) => {
      const statusColor =
        job.status === "published"
          ? "text-green-600 bg-green-50 border-green-100"
          : "text-gray-600 bg-gray-50 border-gray-100";
      const statusText = job.status === "published" ? "Active" : job.status;
      const postedDate = new Date(job.postedAt).toLocaleDateString();

      return `
        <div class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition cursor-pointer" onclick="window.location.href='/Company_jobs'">
            <div>
                <h4 class="font-bold text-gray-800 text-sm">${job.title}</h4>
                <div class="text-xs text-gray-500 mt-1 flex gap-3">
                    <span><i class="fas fa-users"></i> ${
                      job.applicationsCount || 0
                    } apps</span>
                    <span><i class="far fa-clock"></i> ${postedDate}</span>
                </div>
            </div>
            <span class="px-2 py-1 rounded text-[10px] font-bold border uppercase ${statusColor}">
                ${statusText}
            </span>
        </div>
        `;
    })
    .join("");
}

function renderRecentApplications(apps) {
  if (!apps || apps.length === 0) {
    recentAppsContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500 text-sm">
                <i class="fas fa-user-clock mb-2 text-2xl opacity-50"></i>
                <p>No applications yet.</p>
            </div>
        `;
    return;
  }

  recentAppsContainer.innerHTML = apps
    .map((app) => {
      const date = new Date(app.appliedAt).toLocaleDateString();

      // تحديد لون الحالة
      let statusClass = "bg-gray-50 text-gray-600 border-gray-200";
      if (app.status === "New" || app.status === "submitted")
        statusClass = "bg-blue-50 text-blue-600 border-blue-100";
      if (app.status === "Reviewing")
        statusClass = "bg-yellow-50 text-yellow-600 border-yellow-100";
      if (app.status === "Hired")
        statusClass = "bg-green-50 text-green-600 border-green-100";

      return `
        <div class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition cursor-pointer" onclick="window.location.href='/applications'">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold uppercase">
                    ${app.candidateName.charAt(0)}
                </div>
                <div>
                    <h4 class="font-bold text-gray-800 text-sm">${
                      app.candidateName
                    }</h4>
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                        <span class="truncate max-w-[120px]">${
                          app.position
                        }</span>
                        <span>•</span>
                        <span>${date}</span>
                    </div>
                </div>
            </div>
            <span class="text-[10px] font-bold px-2 py-1 rounded border uppercase ${statusClass}">
                ${app.status}
            </span>
        </div>
    `;
    })
    .join("");
}

// ============================================================
// 5. Global Actions
// ============================================================
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    authService.logout();
  });
}
