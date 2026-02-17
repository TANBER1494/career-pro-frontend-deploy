import { jobManagementService } from "../services/jobManagementService.js";
import Toastify from "toastify-js";
import Swal from "sweetalert2";

// --- Elements ---
const jobForm = document.getElementById("jobForm");
const previewMode = document.getElementById("previewMode");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

// Buttons
const btnPreview = document.getElementById("btnPreview");
const btnSaveDraft = document.getElementById("btnSaveDraft");
const btnPublish = document.getElementById("btnPublish");
const btnLogout = document.getElementById("btnLogout");

// Preview Elements (Where we display data)
const prevTitle = document.getElementById("prev-title");
const prevLocation = document.getElementById("prev-location");
const prevType = document.getElementById("prev-type");
const prevLevel = document.getElementById("prev-level");
const prevSalary = document.getElementById("prev-salary");
const prevDescription = document.getElementById("prev-description");
const prevRequirements = document.getElementById("prev-requirements");
const prevSkills = document.getElementById("prev-skills");
const prevExperience = document.getElementById("prev-experience");
const prevEducation = document.getElementById("prev-education");
const prevBenefits = document.getElementById("prev-benefits");

// State
let isPreviewing = false;

// ============================================================
// 1. Toggle Preview Logic (الحل السحري للمعاينة)
// ============================================================
btnPreview.addEventListener("click", () => {
  if (!isPreviewing) {
    // Switch to Preview Mode
    if (!validateBasicFields()) return;

    updatePreviewData(); // 1. خذ البيانات من الفورم وضعها في العرض

    jobForm.classList.add("hidden"); // 2. اخفي الفورم
    previewMode.classList.remove("hidden"); // 3. اظهر المعاينة

    // Update UI Text
    pageTitle.textContent = "Job Preview";
    pageSubtitle.textContent = "Review your job posting before publishing";
    btnPreview.innerHTML =
      '<i class="fas fa-edit"></i> <span>Back to Edit</span>';
    btnPreview.classList.replace("bg-white", "bg-gray-200"); // Visual cue
  } else {
    // Switch back to Edit Mode
    previewMode.classList.add("hidden");
    jobForm.classList.remove("hidden");

    // Update UI Text
    pageTitle.textContent = "Create New Job";
    pageSubtitle.textContent = "Fill in the details for your job posting";
    btnPreview.innerHTML = '<i class="fas fa-eye"></i> <span>Preview</span>';
    btnPreview.classList.replace("bg-gray-200", "bg-white");
  }

  isPreviewing = !isPreviewing;
});

// دالة نقل البيانات من الـ Inputs إلى الـ Preview elements
function updatePreviewData() {
  // Basic Info
  prevTitle.textContent = getValue("title") || "Untitled Job";
  prevLocation.textContent = getValue("location") || "Remote";
  prevType.textContent = getValue("type");
  prevLevel.textContent = getValue("experienceLevel");

  const min = getValue("salaryMin");
  const max = getValue("salaryMax");
  prevSalary.textContent =
    min || max ? `$${min} - $${max}` : "Salary not specified";

  // Text Areas (preserving newlines is hard in HTML without pre-wrap, handled in CSS)
  prevDescription.textContent = getValue("description");
  prevRequirements.textContent = getValue("requirements");
  prevExperience.textContent = getValue("yearsOfExperience") || "--";
  prevEducation.textContent = getValue("education") || "--";
  prevBenefits.textContent = getValue("benefits") || "--";

  // Skills Processing (String -> Badges)
  const skillsStr = getValue("skills");
  prevSkills.innerHTML = "";
  if (skillsStr) {
    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    skills.forEach((skill) => {
      prevSkills.innerHTML += `
                <span class="px-3 py-1 rounded-full text-sm border bg-blue-50 text-blue-700 border-blue-200 font-medium">
                    ${skill}
                </span>`;
    });
  } else {
    prevSkills.innerHTML =
      '<span class="text-gray-400 italic">No skills specified</span>';
  }
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function validateBasicFields() {
  const title = getValue("title");
  const desc = getValue("description");

  if (!title || !desc) {
    Toastify({
      text: "⚠️ Please fill in at least Title and Description to preview.",
      duration: 3000,
      gravity: "top",
      position: "center",
      style: { background: "#f59e0b" },
    }).showToast();
    return false;
  }
  return true;
}

// ============================================================
// 2. Publish / Draft Logic
// ============================================================

const handleSubmit = async (status) => {
  // 1. Collect Data
  const jobData = {
    title: getValue("title"),
    department: getValue("department"),
    location: getValue("location"),
    type: getValue("type"),
    experienceLevel: getValue("experienceLevel"),
    salaryMin: getValue("salaryMin") || 0,
    salaryMax: getValue("salaryMax") || 0,
    description: getValue("description"),
    requirements: getValue("requirements"),
    // Transform comma-separated skills to Array
    skills: getValue("skills")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s),
    yearsOfExperience: getValue("yearsOfExperience"),
    education: getValue("education"),
    benefits: getValue("benefits"),
    status: status, // 'published' (Active) or 'draft'
  };

  // 2. Validate (Basic)
  if (!jobData.title || !jobData.description || !jobData.location) {
    Swal.fire(
      "Missing Fields",
      "Title, Description, and Location are required.",
      "warning"
    );
    return;
  }

  // 3. Send to Backend
  try {
    const actionBtn = status === "published" ? btnPublish : btnSaveDraft;
    const originalText = actionBtn.innerHTML;
    actionBtn.disabled = true;
    actionBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Processing...';

    await jobManagementService.createJob(jobData);

    Swal.fire({
      icon: "success",
      title: status === "published" ? "Job Published!" : "Draft Saved",
      text:
        status === "published"
          ? "Your job is now live and candidates can apply."
          : "Your job has been saved to drafts.",
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      // Redirect to Jobs List
      window.location.href = "/Company_jobs";
    });
  } catch (error) {
    console.error("Post Job Error:", error);
    const message = error.response?.data?.message || "Failed to post job.";
    Swal.fire("Error", message, "error");

    const actionBtn = status === "published" ? btnPublish : btnSaveDraft;
    actionBtn.disabled = false;
    actionBtn.innerHTML = originalText;
  }
};

btnPublish.addEventListener("click", () => handleSubmit("published"));
btnSaveDraft.addEventListener("click", () => handleSubmit("draft"));

// Logout Logic
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/pages/auth/signup-login.html";
  });
}
