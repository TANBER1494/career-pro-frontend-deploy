import { companyService } from "../services/companyService.js";
import { authService } from "../services/authService.js";
import Toastify from "toastify-js";
import Swal from "sweetalert2";

// ============================================================
// 1. Elements
// ============================================================
// Status Elements
const statusBadge = document.getElementById("statusBadge");
const progressBar = document.getElementById("progressBar");
const statusText = document.getElementById("statusText");
const rejectionAlert = document.getElementById("rejectionAlert");
const rejectionReason = document.getElementById("rejectionReason");

// Upload Elements
const uploadCard = document.getElementById("uploadCard");
const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const btnUpload = document.getElementById("btnUpload");
const dropZone = fileInput.closest(".border-dashed"); // المنطقة المحيطة للـ Drag & Drop

// History Element
const historyContainer = document.getElementById("historyContainer");

// State
let selectedFile = null;

// log gout
const btnLogout = document.getElementById("btnLogout");

// ============================================================
// 2. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadVerificationStatus();
  setupEventListeners();
});

// ============================================================
// 3. Logic & Data Fetching
// ============================================================

async function loadVerificationStatus() {
  try {
    // نستخدم getProfile لأنه يحتوي على حالة التوثيق وآخر مستند
    const res = await companyService.getProfile();
    const { verification } = res.data;

    updateUI(verification);
  } catch (error) {
    console.error("Error loading status:", error);
    Toastify({
      text: "Failed to load verification status",
      backgroundColor: "#ef4444",
    }).showToast();
  }
}

function updateUI(data) {
  const status = data.verificationStatus || "unverified";
  const docUrl = data.documentUrl;

  // 1. Update Badge & Progress
  updateStatusBadge(status);

  // 2. Handle Rejection or Success States
  if (status === "rejected") {
    rejectionAlert.classList.remove("hidden");
    // بما أن الباك إند في الـ Profile لا يرجع سبب الرفض حالياً، نعرض رسالة عامة أو نحدث الباك لاحقاً
    // لو عندك حقل rejectionReason في الرد، اعرضه هنا. حالياً سنضع نص افتراضي.
    rejectionReason.textContent =
      "Document was not clear or invalid. Please try again.";
    uploadCard.classList.remove("hidden"); // اسمح بالرفع مجدداً
    resetUploadForm();
  } else if (
    status === "verified" ||
    status === "in_progress" ||
    status === "pending"
  ) {
    rejectionAlert.classList.add("hidden");
    uploadCard.classList.add("hidden"); // اخفِ الرفع إذا كان قيد المراجعة أو تم التوثيق

    if (status === "verified") {
      statusText.textContent =
        "Congratulations! Your company is fully verified.";
    } else {
      statusText.textContent =
        "Your documents are under review. This usually takes 24-48 hours.";
    }
  } else {
    // Unverified
    rejectionAlert.classList.add("hidden");
    uploadCard.classList.remove("hidden");
    statusText.textContent =
      "Please upload the required document to start the verification process.";
  }

  // 3. Update History List (عرض آخر ملف مرفوع)
  renderHistory(docUrl, status);
}

function updateStatusBadge(status) {
  // Reset classes
  statusBadge.className =
    "px-3 py-1 rounded-full text-sm font-semibold border capitalize";

  switch (status) {
    case "verified":
      statusBadge.classList.add(
        "bg-green-100",
        "text-green-700",
        "border-green-200",
        "dark:bg-green-600",
        "dark:text-green-200",
        "dark:border-green-600"
      );
      statusBadge.textContent = "Verified";
      progressBar.style.width = "100%";
      progressBar.classList.replace("bg-cyan-600", "bg-green-500");
      break;
    case "in_progress":
    case "pending":
      statusBadge.classList.add(
        "bg-yellow-100",
        "text-yellow-700",
        "border-yellow-200",
        "dark:bg-yellow-900/60",
        "dark:border-yellow-900/60",
        "dark:text-gray-200"
      );
      statusBadge.textContent = "Pending Review";
      progressBar.style.width = "50%";
      break;
    case "rejected":
      statusBadge.classList.add(
        "bg-red-100",
        "text-red-700",
        "border-red-200",
        "dark:bg-red-900/60",
        "dark:border-red-900/60",
        "dark:text-gray-200"
      );
      statusBadge.textContent = "Rejected";
      progressBar.style.width = "0%";
      progressBar.classList.replace("bg-blue-600", "bg-red-500");
      break;
    default: // unverified
      statusBadge.classList.add(
        "bg-gray-100",
        "text-gray-600",
        "border-gray-200",
        "dark:bg-gray-500/30",
        "dark:text-gray-400",
        "dark:border-gray-400"
      );
      statusBadge.textContent = "Unverified";
      progressBar.style.width = "0%";
  }
}

function renderHistory(docUrl, status) {
  if (!docUrl) {
    historyContainer.innerHTML =
      '<p class="text-gray-500 text-sm italic">No documents uploaded yet.</p>';
    return;
  }

  // استخراج اسم الملف من الرابط (بما أننا لا نملك الاسم الأصلي في رد البروفايل حالياً)
  // في الباك إند الحقيقي يفضل إرجاع fileName في الـ response
  const fileName = docUrl.split("/").pop() || "Verification Document";

  let statusColor = "text-blue-600";
  if (status === "verified") statusColor = "text-green-600";
  if (status === "rejected") statusColor = "text-red-600";

  historyContainer.innerHTML = `
        <div
  class="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-black/30"
>
  <div class="flex items-center gap-3">
    <i class="fas fa-file-pdf text-red-500 dark:text-red-400 text-xl"></i>
    <div>
      <div class="font-medium text-gray-900 dark:text-slate-100">
        ${fileName}
      </div>
      <div
        class="text-sm text-gray-500 dark:text-slate-400 capitalize status-text"
      >
        ${status}
      </div>
    </div>
  </div>
  <div class="flex items-center gap-2">
    <a
      href="${docUrl}"
      target="_blank"
      class="p-2 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
      title="View"
    >
      <i class="fas fa-eye"></i>
    </a>
  </div>
</div>
    `;
}

// ============================================================
// 4. Event Listeners
// ============================================================

function setupEventListeners() {
  // File Selection
  fileInput.addEventListener("change", handleFileSelect);

  // Upload Button
  btnUpload.addEventListener("click", handleUpload);

  // Drag & Drop Effects
  if (dropZone) {
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(eventName, highlight, false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener("drop", handleDrop, false);
  }
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  dropZone.classList.add("border-blue-500", "bg-blue-50");
}

function unhighlight() {
  dropZone.classList.remove("border-blue-500", "bg-blue-50");
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files.length > 0) {
    fileInput.files = files; // Update input files
    handleFileSelect({ target: fileInput });
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      const isDarkMode = document.documentElement.classList.contains('dark');
      Swal.fire({
        title:"Error",
        text:"File size must be less than 5MB", 
        icon:"error",
        background: isDarkMode ? '#1e1b4b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#1e293b',
        confirmButtonColor: '#4361ee',
        });
        fileInput.value = "";
      return;
      }

    selectedFile = file;
    fileNameDisplay.textContent = `Selected: ${file.name}`;
    fileNameDisplay.classList.remove("hidden");
    btnUpload.disabled = false;
    btnUpload.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

async function handleUpload() {
  if (!selectedFile) return;

  try {
    // UI Loading
    const originalText = btnUpload.innerHTML;
    btnUpload.disabled = true;
    btnUpload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    // Call Service
    await companyService.uploadVerificationDoc(selectedFile);
    const isDarkMode = document.documentElement.classList.contains('dark');
    // Success
    Swal.fire({
      icon: "success",
      title: "Uploaded!",
      text: "Your document has been submitted for review.",
      timer: 2000,
      showConfirmButton: false,
      background: isDarkMode ? '#1e1b4b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      confirmButtonColor: '#4361ee',
    }).then(() => {
      // Reload page state
      loadVerificationStatus();
    });
  } catch (error) {
    const isDarkMode = document.documentElement.classList.contains('dark');
    console.error(error);
    Swal.fire({
      title:"Error",
      text:error.response?.data?.message || "Upload failed",
      icon:"error",
      background: isDarkMode ? '#1e1b4b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
    });
    btnUpload.disabled = false;
    btnUpload.innerHTML =
      '<i class="fas fa-upload"></i> Upload Verification Document';
  }
}

function resetUploadForm() {
  fileInput.value = "";
  selectedFile = null;
  fileNameDisplay.textContent = "";
  fileNameDisplay.classList.add("hidden");
  btnUpload.disabled = true;
  btnUpload.classList.add("opacity-50", "cursor-not-allowed");
}

if (btnLogout) {
  btnLogout.addEventListener("click", (e) => {
    e.preventDefault(); // 2. منع أي سلوك افتراضي
    console.log("Logout clicked"); // 3. للتجربة والتأكد
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