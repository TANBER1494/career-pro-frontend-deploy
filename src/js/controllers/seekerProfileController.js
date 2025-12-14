import { seekerService } from "../services/seekerService.js";
import { authService } from "../services/authService.js";
import Swal from "sweetalert2";

// ============================================================
// 1. Elements & State
// ============================================================
// Containers
const viewMode = document.getElementById("viewMode");
const editMode = document.getElementById("editMode");
const loadingState = document.getElementById("loadingState");
const profileContent = document.getElementById("profileContent");

// Buttons
const btnEditProfile = document.getElementById("btnEditProfile");
const btnEditProfileIcon = document.querySelector(
  'button[onclick*="btnEditProfile"]'
);
const btnCancelEdit = document.getElementById("btnCancelEdit");
const btnSaveChanges = document.getElementById("btnSaveChanges");
const btnLogout = document.getElementById("btnLogout");

// State
let currentProfile = {};

// ============================================================
// 2. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  init();
  setupTabs();
});

async function init() {
  if (loadingState) loadingState.classList.remove("hidden");
  if (profileContent) profileContent.classList.add("hidden");

  await loadProfileData();
  await loadApplications();

  if (loadingState) loadingState.classList.add("hidden");
  if (profileContent) profileContent.classList.remove("hidden");
}

// ============================================================
// 3. Logic: Load Profile Data (FIXED NAME LOGIC)
// ============================================================
async function loadProfileData() {
  try {
    const res = await seekerService.getMe();

    // استخراج البيانات
    const backendData = res.data || {};
    const personal = backendData.personal || {};
    const education = backendData.education || {};
    const cv = backendData.cv || {};

    // دمج مع بيانات المصادقة (Local Storage)
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");

    // ✅ حل مشكلة الاسم: الأولوية للاسم القادم من الباك، ثم اللوكال
    let finalName = personal.fullName; // 1. من البروفايل

    if (!finalName) {
      // 2. تجميع من اللوكال ستورج إذا كان البروفايل فارغاً
      const fName = localUser.firstName || "";
      const lName = localUser.lastName || "";
      if (fName || lName) {
        finalName = `${fName} ${lName}`.trim();
      }
    }

    // بناء كائن موحد
    currentProfile = {
      // Basic & Contact
      fullName: finalName || "User", // ✅ الاسم النهائي
      firstName: localUser.firstName || "",
      lastName: localUser.lastName || "",
      email: localUser.email || personal.email || "",
      phoneNumber: personal.phoneNumber || personal.phone || "",

      // Job & Location
      jobTitle: personal.jobTitle || "",
      summary: personal.summary || "",
      country: personal.country || "",
      city: personal.city || "",

      // Career Details
      experienceLevel: personal.experienceLevel || "",
      yearsOfExperience: personal.yearsOfExperience || 0,
      industry: personal.industry || "",

      // Personal Details
      birthDate: personal.birthDate || "",
      gender: personal.gender || "",

      // Education
      degree: education.degree || "",
      university: education.university || "",
      graduationYear: education.graduationYear || "",
      gpa: education.gpa || "",

      // Preferences
      jobType: education.jobType || education.workType || "", // Check both keys
      workplaceSetting: education.workplaceSetting || education.workPlace || "", // Check both keys

      // Links
      linkedin: personal.linkedin || "",
      personalWebsite: personal.personalWebsite || "",

      // CV
      cvName: cv.fileName || "",
      cvUrl: cv.cvUrl || "",
    };

    console.log("✅ Profile Loaded:", currentProfile);
    renderViewMode(currentProfile);
  } catch (error) {
    console.error("Load Error:", error);
    // Fallback
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (localUser.email) {
      const fallbackName = `${localUser.firstName || ""} ${
        localUser.lastName || ""
      }`.trim();
      renderViewMode({
        fullName: fallbackName || "User",
        email: localUser.email,
      });
    }
  }
}

// ============================================================
// 4. Logic: Render View Mode
// ============================================================
function renderViewMode(data) {
  if (!data) return;

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val && val !== "undefined" ? val : "--";
  };

  // --- Header ---
  // ✅ عرض الاسم الموحد
  setText("fullNameView", data.fullName);
  setText("view-fullName", data.fullName);

  // Initials
  const initials = data.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  setText("view-initials", initials || "ME");

  setText("jobTitleView", data.jobTitle || data.industry || "Job Seeker");
  setText("view-industry", data.jobTitle || data.industry);

  // --- Contact Badges ---
  setText(
    "view-location",
    data.city || data.country
      ? `${data.city || ""}, ${data.country || ""}`
      : "--"
  );
  setText(
    "view-years",
    data.yearsOfExperience ? `${data.yearsOfExperience} Yrs Exp` : "--"
  );
  setText("view-email", data.email);
  setText("view-phone", data.phoneNumber);

  // --- Overview Tab ---
  setText("summaryView", data.summary || "No professional summary added yet.");

  // Education
  setText("view-degree", data.degree);
  setText("view-university", data.university);
  setText("view-gradYear", data.graduationYear);
  setText("view-gpa", data.gpa);
  if (data.gpa)
    document.getElementById("view-gpa-container")?.classList.remove("hidden");

  // Career Info
  setText("view-expLevel", data.experienceLevel);
  setText("view-yearsExp", data.yearsOfExperience);
  setText("view-industryDetail", data.industry);

  // Personal Details
  setText(
    "view-birthDate",
    data.birthDate ? new Date(data.birthDate).toLocaleDateString() : "--"
  );
  setText("view-gender", data.gender);
  setText("view-country", data.country);

  // Preferences
  setText("view-jobType", data.jobType);
  setText("view-workplace", data.workplaceSetting);

  // CV
  setText("view-cvName", data.cvName || "No CV uploaded");
  const cvLink = document.getElementById("view-cvLink");
  if (cvLink) {
    if (data.cvUrl) {
      const fullPath = data.cvUrl.startsWith("http")
        ? data.cvUrl
        : `http://localhost:3000${data.cvUrl}`;
      cvLink.href = fullPath;
      cvLink.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      cvLink.href = "#";
      cvLink.classList.add("opacity-50", "cursor-not-allowed");
    }
  }

  // Links
  const linkedinLink = document.getElementById("linkedinLink");
  if (linkedinLink) {
    linkedinLink.href = data.linkedin || "#";
    if (!data.linkedin) linkedinLink.classList.add("opacity-50");
    else linkedinLink.classList.remove("opacity-50");
  }

  const portfolioLink = document.getElementById("portfolioLink");
  if (portfolioLink) {
    portfolioLink.href = data.personalWebsite || "#";
    if (!data.personalWebsite) portfolioLink.classList.add("opacity-50");
    else portfolioLink.classList.remove("opacity-50");
  }
}

// ============================================================
// 5. Logic: Load Applications (Tab 2)
// ============================================================
async function loadApplications() {
  const container = document.getElementById("applicationsContainer");
  if (!container) return;

  try {
    const res = await seekerService.getMyApplications();
    const apps = res.data.applications || [];

    const countBadge = document.getElementById("appsCount");
    if (countBadge) countBadge.textContent = `${apps.length} Applied`;

    if (apps.length === 0) {
      container.innerHTML = `
                <div class="text-center py-10 text-gray-400">
                    <i class="fas fa-folder-open text-4xl mb-3 opacity-30"></i>
                    <p>No applications yet.</p>
                    <a href="jobs.html" class="text-primary font-bold hover:underline mt-2 inline-block">Browse Jobs</a>
                </div>`;
      return;
    }

    container.innerHTML = apps
      .map((app) => {
        let statusClass = "bg-gray-100 text-gray-600";
        if (app.status === "New")
          statusClass = "bg-blue-50 text-blue-600 border-blue-100";
        if (app.status === "Reviewing")
          statusClass = "bg-yellow-50 text-yellow-600 border-yellow-100";
        if (app.status === "Hired")
          statusClass = "bg-green-50 text-green-600 border-green-100";
        if (app.status === "Rejected")
          statusClass = "bg-red-50 text-red-600 border-red-100";

        return `
            <div class="bg-white border border-gray-100 rounded-lg p-4 mb-3 hover:shadow-sm transition flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-gray-800 text-sm">${
                      app.position || "Unknown Role"
                    }</h4>
                    <p class="text-xs text-gray-500 mt-1">Applied: ${new Date(
                      app.appliedAt
                    ).toLocaleDateString()}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusClass}">
                    ${app.status}
                </span>
            </div>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Apps Error:", error);
  }
}

// ============================================================
// 6. Edit Mode & Form Population
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
if (btnEditProfileIcon)
  btnEditProfileIcon.addEventListener("click", () => {
    populateEditForm(currentProfile);
    toggleView(true);
  });
if (btnCancelEdit)
  btnCancelEdit.addEventListener("click", () => toggleView(false));

function populateEditForm(data) {
  if (!data) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };

  // ✅ ملء الاسم الكامل في الفورم
  setVal("input-fullName", data.fullName);

  setVal("input-jobTitle", data.jobTitle);
  setVal("input-summary", data.summary);
  setVal("input-phoneNumber", data.phoneNumber);
  setVal("input-country", data.country);
  setVal("input-city", data.city);

  if (data.birthDate) {
    try {
      setVal(
        "input-birthDate",
        new Date(data.birthDate).toISOString().split("T")[0]
      );
    } catch (e) {}
  }

  setVal("input-gender", data.gender);
  setVal("input-experienceLevel", data.experienceLevel);
  setVal("input-yearsOfExperience", data.yearsOfExperience);
  setVal("input-industry", data.industry);

  setVal("input-degree", data.degree);
  setVal("input-university", data.university);
  setVal("input-graduationYear", data.graduationYear);
  setVal("input-gpa", data.gpa);

  setVal("input-jobType", data.jobType);
  setVal("input-workplaceSetting", data.workplaceSetting);

  setVal("input-linkedin", data.linkedin);
  setVal("input-personalProfile", data.personalWebsite);
}

// ============================================================
// 7. Save Changes Logic
// ============================================================

btnSaveChanges.addEventListener("click", async (e) => {
  e.preventDefault();

  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  const updatedData = {
    // ✅ إرسال الاسم الكامل
    fullName: getVal("input-fullName"),

    // Step 1 Data
    phoneNumber: getVal("input-phoneNumber"),
    birthDate: getVal("input-birthDate"),
    gender: getVal("input-gender"),
    yearsOfExperience: Number(getVal("input-yearsOfExperience")) || 0,
    experienceLevel: getVal("input-experienceLevel"),
    industry: getVal("input-industry"),
    country: getVal("input-country"),
    city: getVal("input-city"),

    // Step 2 Data
    degree: getVal("input-degree"),
    university: getVal("input-university"),
    graduationYear: Number(getVal("input-graduationYear")) || null,
    gpa: Number(getVal("input-gpa")) || null,
    jobType: getVal("input-jobType"),
    workplaceSetting: getVal("input-workplaceSetting"),

    // Extra
    jobTitle: getVal("input-jobTitle"),
    summary: getVal("input-summary"),
    linkedin: getVal("input-linkedin"),
    personalWebsite: getVal("input-personalProfile"),
  };

  try {
    const originalText = btnSaveChanges.innerHTML;
    btnSaveChanges.disabled = true;
    btnSaveChanges.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Saving...';

    await seekerService.updateProfile(updatedData);

    Swal.fire({
      icon: "success",
      title: "Profile Updated",
      text: "Your changes have been saved successfully.",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      loadProfileData(); // Reload view
      toggleView(false); // Switch to view mode
    });
  } catch (error) {
    console.error("Update Error:", error);

    let msg = "Failed to update profile.";
    if (error.response?.data?.message) {
      msg = error.response.data.message;
    } else if (error.response?.status === 400) {
      msg = "Invalid data. Please check your inputs.";
    }

    Swal.fire("Error", msg, "error");
  } finally {
    btnSaveChanges.disabled = false;
    btnSaveChanges.innerHTML = "Save Changes";
  }
});

// ============================================================
// 8. Helpers: Tabs & Logout
// ============================================================

function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) =>
        t.classList.remove(
          "active",
          "text-primary",
          "border-b-2",
          "border-primary"
        )
      );
      tabs.forEach((t) => t.classList.add("text-slate-600"));

      panes.forEach((p) => p.classList.add("hidden"));

      tab.classList.add(
        "active",
        "text-primary",
        "border-b-2",
        "border-primary"
      );
      tab.classList.remove("text-slate-600");

      const targetId = tab.dataset.target;
      document.getElementById(targetId)?.classList.remove("hidden");
    });
  });
}

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    authService.logout();
  });
}

