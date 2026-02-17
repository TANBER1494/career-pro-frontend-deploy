import { jobManagementService } from "../services/jobManagementService.js";
import { jobService } from "../services/jobService.js"; // نحتاجه لجلب تفاصيل الوظيفة
import Toastify from "toastify-js";
import Swal from "sweetalert2";

// ============================================================
// 1. Variables & Elements
// ============================================================

// URL Params
const urlParams = new URLSearchParams(window.location.search);
const jobId = urlParams.get("id");

// Layout Elements
const loadingState = document.getElementById("loadingState");
const jobForm = document.getElementById("jobForm");
const previewMode = document.getElementById("previewMode");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

// Buttons
const btnPreview = document.getElementById("btnPreview");
const btnSaveChanges = document.getElementById("btnSaveChanges");
const btnLogout = document.getElementById("btnLogout");

// Form Inputs IDs map (match HTML IDs)
const formFields = [
  "title",
  "department",
  "location",
  "type",
  "experienceLevel",
  "salaryMin",
  "salaryMax",
  "description",
  "requirements",
  "skills",
  "yearsOfExperience",
  "education",
  "benefits",
];

// State
let isPreviewing = false;
let currentJobData = null;

// ============================================================
// 2. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  if (!jobId) {
    Swal.fire({
      icon: "error",
      title: "Missing Job ID",
      text: "No job selected for editing.",
      confirmButtonText: "Back to Jobs",
    }).then(() => {
      window.location.href = "/Company_jobs";
    });
    return;
  }

  await loadJobDetails();
});

// ============================================================
// 3. Fetch & Populate Data
// ============================================================
async function loadJobDetails() {
  try {
    // Show loading, hide form
    loadingState.classList.remove("hidden");
    jobForm.classList.add("hidden");

    // Fetch Details (Using the public endpoint since it returns full details)
    const res = await jobService.getJobDetails(jobId);
    currentJobData = res.data.job;

    // Populate Form
    populateForm(currentJobData);

    // Hide loading, show form
    loadingState.classList.add("hidden");
    jobForm.classList.remove("hidden");
  } catch (error) {
    console.error("Error loading job:", error);
    Swal.fire({
      icon: "error",
      title: "Load Failed",
      text: "Could not fetch job details. Please try again.",
      confirmButtonText: "Back to Jobs",
    }).then(() => {
      window.location.href = "/Company_jobs";
    });
  }
}

function populateForm(job) {
  // Loop through fields and set values
  formFields.forEach((field) => {
    const element = document.getElementById(field);
    if (element) {
      let value = job[field];

      // Special handling for arrays (Skills)
      if (Array.isArray(value)) {
        value = value.join(", ");
      }

      element.value = value || "";
    }
  });
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

// ============================================================
// 4. Preview Logic
// ============================================================
btnPreview.addEventListener("click", (e) => {
  e.preventDefault(); // Prevent form submit if inside form tag

  if (!isPreviewing) {
    // Switch to Preview
    updatePreviewData();
    jobForm.classList.add("hidden");
    previewMode.classList.remove("hidden");

    // UI Updates
    pageTitle.textContent = "Job Preview";
    pageSubtitle.textContent = "Review changes before saving";
    btnPreview.innerHTML =
      '<i class="fas fa-edit"></i> <span>Back to Edit</span>';
  } else {
    // Switch to Edit
    previewMode.classList.add("hidden");
    jobForm.classList.remove("hidden");

    // UI Updates
    pageTitle.textContent = "Edit Job";
    pageSubtitle.textContent = "Update your job posting details";
    btnPreview.innerHTML = '<i class="fas fa-eye"></i> <span>Preview</span>';
  }

  isPreviewing = !isPreviewing;
});

function updatePreviewData() {
  // Mapping input values to preview elements
  setText("prev-title", getValue("title"));
  setText("prev-location", getValue("location"));
  setText("prev-type", getValue("type"));
  setText("prev-level", getValue("experienceLevel"));

  const min = getValue("salaryMin");
  const max = getValue("salaryMax");
  setText(
    "prev-salary",
    min || max ? `$${min} - $${max}` : "Salary not specified"
  );

  setText("prev-description", getValue("description"));
  setText("prev-requirements", getValue("requirements"));
  setText("prev-experience", getValue("yearsOfExperience"));
  setText("prev-education", getValue("education"));
  setText("prev-benefits", getValue("benefits"));

  // Skills Badges
  const skillsContainer = document.getElementById("prev-skills");
  const skillsStr = getValue("skills");
  skillsContainer.innerHTML = "";

  if (skillsStr) {
    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    skills.forEach((skill) => {
      skillsContainer.innerHTML += `<span class="skill-badge">${skill}</span>`;
    });
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || "--";
}

// ============================================================
// 5. Save Changes Logic
// ============================================================
btnSaveChanges.addEventListener("click", async (e) => {
  e.preventDefault();

  // 1. Collect Data
  const updateData = {
    title: getValue("title"),
    department: getValue("department"),
    location: getValue("location"),
    type: getValue("type"),
    experienceLevel: getValue("experienceLevel"),
    salaryMin: getValue("salaryMin") || 0,
    salaryMax: getValue("salaryMax") || 0,
    description: getValue("description"),
    requirements: getValue("requirements"),
    // Convert skills string back to array
    skills: getValue("skills")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s),
    yearsOfExperience: getValue("yearsOfExperience"),
    education: getValue("education"),
    benefits: getValue("benefits"),
  };

  // 2. Validation (Basic)
  if (!updateData.title || !updateData.description || !updateData.location) {
    Toastify({
      text: "Please fill in Title, Description, and Location.",
      backgroundColor: "#f59e0b",
    }).showToast();
    return;
  }

  // 3. Send Request
  try {
    // UI Feedback
    const originalText = btnSaveChanges.innerHTML;
    btnSaveChanges.disabled = true;
    btnSaveChanges.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Saving...';

    await jobManagementService.editJob(jobId, updateData);

    Swal.fire({
      icon: "success",
      title: "Updated!",
      text: "Job details have been updated successfully.",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      window.location.href = "/Company_jobs";
    });
  } catch (error) {
    console.error("Update Error:", error);
    const message = error.response?.data?.message || "Failed to update job.";
    Swal.fire("Error", message, "error");

    // Reset Button
    btnSaveChanges.disabled = false;
    btnSaveChanges.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  }
});

// Logout
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/pages/auth/signup-login.html";
  });
}
