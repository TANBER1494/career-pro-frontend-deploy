import { adminService } from "../services/adminService.js";
import { authService } from "../services/authService.js";
import Swal from "sweetalert2";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Security Check: Ensure User is Admin
  checkAdminAccess();

  // 2. Fetch Stats
  loadDashboardStats();

  // 3. Logout Logic
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    authService.logout();
  });
});

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.accountType !== "admin") {
    // If not admin, kick them out
    window.location.href = "../../../index.html";
  }
}

async function loadDashboardStats() {
  try {
    const data = await adminService.getStats();
    const stats = data.data.stats;

    // Animate Numbers (Optional Polish)
    animateValue("stat-seekers", 0, stats.totalSeekers, 1000);
    animateValue("stat-companies", 0, stats.totalCompanies, 1000);
    animateValue("stat-jobs", 0, stats.totalJobs, 1000);
    animateValue("stat-pending", 0, stats.pendingVerifications, 1000);

    // Update Pending Badge in Sidebar
    const badge = document.getElementById("nav-pending-badge");
    if (stats.pendingVerifications > 0) {
      badge.textContent = stats.pendingVerifications;
      badge.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Failed to load stats", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to load dashboard statistics.",
    });
  }
}

// دالة بسيطة لعمل أنيميشن للأرقام (عداد بيزيد)
function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;
  
  if (end === 0) {
      obj.innerHTML = "0";
      return;
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}