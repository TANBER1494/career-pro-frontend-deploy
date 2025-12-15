import { companyDiscoveryService } from "../services/companyDiscoveryService.js";
import { jobService } from "../services/jobService.js"; // نحتاجها للتقديم والحفظ
import Swal from "sweetalert2"; // نحتاجها للتنبيهات

// ============================================================
// Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get("id");

  if (!companyId) {
    window.location.href = "companies.html";
    return;
  }

  await loadCompanyDetails(companyId);

  // تهيئة أحداث المودال (للتقديم)
  initModalEvents();
});

// ============================================================
// Fetch Logic
// ============================================================
async function loadCompanyDetails(id) {
  const loader = document.getElementById("details-loader");
  const content = document.getElementById("details-content");

  try {
    const response = await companyDiscoveryService.getCompanyDetails(id);
    const responseData = response.data || {};

    const company = responseData.company;
    const openPositions = responseData.openPositions || [];

    if (!company) {
      throw new Error("Company data not found");
    }

    // Render Data
    renderCompanyHeader(company);
    renderCompanyAbout(company);

    // ✅ نمرر كائن الشركة هنا لنستخدم اسمها وصورتها في الكروت
    renderCompanyJobs(openPositions, company);

    if (loader) loader.classList.add("hidden");
    if (content) content.classList.remove("hidden");
  } catch (error) {
    console.error("Error loading details:", error);
    if (content) {
      content.innerHTML = `
                <div class="text-center py-20">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i>
                    <p class="text-slate-500">Failed to load company details.</p>
                    <a href="companies.html" class="text-blue-600 hover:underline mt-2 inline-block">Back to Companies</a>
                </div>
            `;
      content.classList.remove("hidden");
      if (loader) loader.classList.add("hidden");
    }
  }
}

// ============================================================
// Render Logic: Header & Info
// ============================================================
function renderCompanyHeader(company) {
  const name = company.name || company.companyName || "Unknown";

  setText("detail-name", name);
  setText("detail-industry", company.industry);
  setText("detail-location", company.location);
  setText("detail-size", company.size || company.companySize);
  setText("detail-founded", company.foundedYear);

  const alertBox = document.getElementById("detail-verified-alert");
  if (alertBox) {
    if (company.isVerified) alertBox.classList.add("hidden");
    else alertBox.classList.remove("hidden");
  }

  const webBtn = document.getElementById("detail-website");
  if (webBtn) {
    if (company.website) {
      webBtn.href = company.website.startsWith("http")
        ? company.website
        : `https://${company.website}`;
      webBtn.classList.remove("hidden");
    } else {
      webBtn.classList.add("hidden");
    }
  }

  const logoImg = document.getElementById("detail-logo");
  const logoInit = document.getElementById("detail-initial");

  if (logoImg && logoInit) {
    if (
      company.logo &&
      company.logo.length > 10 &&
      !company.logo.includes("url...")
    ) {
      logoImg.src = company.logo;
      logoImg.classList.remove("hidden");
      logoInit.classList.add("hidden");
    } else {
      logoImg.classList.add("hidden");
      logoInit.classList.remove("hidden");
      logoInit.innerText = name.charAt(0).toUpperCase();
    }
  }
}

function renderCompanyAbout(company) {
  const description =
    company.description ||
    company.companyDescription ||
    company.about ||
    "No description provided by the company.";
  const descEl = document.getElementById("detail-desc");
  if (descEl) descEl.innerText = description;

  const benefitsContainer = document.getElementById("detail-benefits");
  if (benefitsContainer) {
    const benefits = company.benefits || [];
    if (benefits.length > 0) {
      benefitsContainer.innerHTML = benefits
        .map(
          (benefit) => `
                <span class="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-100 flex items-center gap-2">
                    <i class="fa-solid fa-check text-[10px]"></i> ${benefit}
                </span>
            `
        )
        .join("");
    } else {
      benefitsContainer.innerHTML =
        '<span class="text-slate-400 text-xs italic">No specific benefits listed.</span>';
    }
  }
}

// ============================================================
// Render Logic: Jobs Cards (Updated Design)
// ============================================================
function renderCompanyJobs(jobs, companyInfo) {
  const jobsList = document.getElementById("detail-jobs-list");
  const jobsCountLabel = document.getElementById("detail-jobs-count");

  if (jobsCountLabel) jobsCountLabel.innerText = jobs.length;

  if (!jobsList) return;

  if (jobs.length === 0) {
    jobsList.innerHTML = `
            <div class="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <i class="fa-solid fa-briefcase text-slate-300 text-2xl mb-2"></i>
                <p class="text-slate-500 text-sm">No open positions at the moment.</p>
            </div>
        `;
    return;
  }

  // تجهيز بيانات الشركة الثابتة لكل الكروت
  const companyName =
    companyInfo.name || companyInfo.companyName || "Hiring Company";
  const companyLogo =
    companyInfo.logo && !companyInfo.logo.includes("url...")
      ? companyInfo.logo
      : "https://placehold.co/48x48?text=Logo";
  const location = companyInfo.location || "Remote";

  jobsList.innerHTML = jobs
    .map((job) => {
      const timeAgo = getTimeAgo(job.postedAt || job.createdAt);
      const jobId = job.id || job._id;

      // Save Icon State
      const saveIconClass = job.isSaved
        ? "fa-solid text-blue-600"
        : "fa-regular text-slate-400";

      // Skills (أول 3 مهارات)
      const skillsHTML = (job.skills || [])
        .slice(0, 3)
        .map(
          (skill) =>
            `<span class="px-2 py-1 bg-slate-50 text-slate-600 rounded text-[10px] font-medium border border-slate-200">${skill}</span>`
        )
        .join("");

      // ✅ تصميم الكارت المطابق لصفحة الوظائف (All Jobs Style)
      return `
        <div class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative group border border-slate-200 flex flex-col h-full mb-4">
            
            <button onclick="window.toggleSaveJob('${jobId}', this)" class="absolute top-5 right-5 hover:text-blue-600 transition-colors z-20 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50" title="Save Job">
                <i class="${saveIconClass} fa-bookmark text-lg"></i>
            </button>

            <div class="flex items-start gap-4 mb-3">
                <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden shrink-0 border border-blue-100 p-1">
                    <img src="${companyLogo}" alt="${companyName}" class="w-full h-full object-cover rounded-md">
                </div>
                <div>
                    <h3 class="font-medium font-poppins text-slate-900 leading-tight line-clamp-1 hover:text-blue-600 cursor-pointer" onclick="window.location.href='/job-details.html?id=${jobId}'">
                        ${job.title}
                    </h3>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span class="font-medium text-slate-700">
                            <i class="fa-regular fa-building mr-1"></i> ${companyName}
                        </span>
                        <span><i class="fa-solid fa-location-dot mr-1"></i> ${location}</span>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 mb-4">
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
                    ${job.type || "Full Time"}
                </span>
                <button onclick="window.applyForJobCheck('${jobId}')" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-blue-500/20 shadow-sm ml-auto text-center">
                    Apply Now
                </button>
            </div>
        </div>
        `;
    })
    .join("");
}

// ============================================================
// Global Actions (Apply & Save) - Must be global for onclick
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
      if (result.isConfirmed) {
        window.location.href = "/src/pages/auth/signup-login.html";
      }
    });
    return;
  }

  const modal = document.getElementById("applyModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.dataset.jobId = jobId;

    // Prefill Data
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const nameInput = document.getElementById("applyName");
    const emailInput = document.getElementById("applyEmail");

    if (nameInput && user.firstName)
      nameInput.value = `${user.firstName} ${user.lastName || ""}`.trim();
    if (emailInput && user.email) emailInput.value = user.email;
  } else {
    console.error("Modal element not found in HTML!");
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
  const modal = document.getElementById("applyModal");
  if (modal) modal.classList.add("hidden");
};

function initModalEvents() {
  const modal = document.getElementById("applyModal");
  const closeBtn = document.getElementById("btnCloseModal");
  const cancelBtn = document.getElementById("btnCancelModal");
  const form = document.getElementById("applyForm");
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

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
    // Clone to remove old listeners (Prevents Double Submission)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // Re-select elements inside new form
    const newSubmitBtn = newForm.querySelector('button[type="submit"]');

    newForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const jobId = modal.dataset.jobId;
      // Note: We access elements by ID from document since IDs are unique
      const fileInput = document.getElementById("applyCv");

      if (!fileInput.files || fileInput.files.length === 0) {
        Swal.fire("Warning", "Please upload your CV.", "warning");
        return;
      }

      const applyData = {
        fullName: document.getElementById("applyName").value,
        email: document.getElementById("applyEmail").value,
        phone: document.getElementById("applyPhone").value,
        cvFile: fileInput.files[0],
        coverLetter: document.getElementById("applyCover").value,
      };

      try {
        if (newSubmitBtn) {
          newSubmitBtn.disabled = true;
          newSubmitBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }

        await jobService.applyForJob(jobId, applyData);

        Swal.fire("Success", "Application submitted successfully!", "success");
        close();
      } catch (error) {
        let msg = "Failed to submit application.";
        if (error.response?.status === 409)
          msg = "You have already applied for this job.";
        else if (error.response?.data?.message)
          msg = error.response.data.message;

        Swal.fire("Error", msg, "error");
      } finally {
        if (newSubmitBtn) {
          newSubmitBtn.disabled = false;
          newSubmitBtn.innerHTML = "Submit Application";
        }
      }
    });
  }
}

// Helpers
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text || "N/A";
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
