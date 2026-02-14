import { adminService } from "../services/adminService.js";
import { authService } from "../services/authService.js";
import axiosClient from "../utils/axiosClient.js"; // نحتاج هذا لاستدعاء APIs الجديدة إذا لم تكن في Service
import Swal from "sweetalert2";

document.addEventListener("DOMContentLoaded", () => {
  checkAdminAccess();
  
  // Default Tab
  let activeTab = "seekers"; 
  
  // Initial Render
  updateTableHeaders(activeTab);
  fetchData(activeTab);

  setupEventListeners();
});

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.accountType !== "admin") {
    window.location.href = "../../../index.html";
  }
}

let currentTab = "seekers"; // Global state for current tab

function setupEventListeners() {
  const tabSeekers = document.getElementById("tab-seekers");
  const tabCompanies = document.getElementById("tab-companies");
  const searchInput = document.getElementById("searchInput");

  // A. Tab Switching
  tabSeekers.addEventListener("click", () => {
    switchTab("seekers");
  });

  tabCompanies.addEventListener("click", () => {
    switchTab("companies");
  });

  // B. Search (Debounced)
  let timeoutId;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fetchData(currentTab, e.target.value);
    }, 500);
  });

  // C. Refresh
  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    fetchData(currentTab, searchInput.value);
  });

  // D. Delete Action
  document.getElementById("usersTableBody").addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-btn");
    if (btn) {
      handleDelete(btn.dataset.id);
    }
  });

  // E. Logout
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    authService.logout();
  });
}

function switchTab(tab) {
  currentTab = tab;
  
  // Update UI Classes
  const tabSeekers = document.getElementById("tab-seekers");
  const tabCompanies = document.getElementById("tab-companies");

  if (tab === "seekers") {
    tabSeekers.className = "tab-active px-6 py-2 transition-all focus:outline-none";
    tabCompanies.className = "tab-inactive px-6 py-2 transition-all focus:outline-none";
    document.getElementById("searchInput").placeholder = "Search seekers by name...";
  } else {
    tabCompanies.className = "tab-active px-6 py-2 transition-all focus:outline-none";
    tabSeekers.className = "tab-inactive px-6 py-2 transition-all focus:outline-none";
    document.getElementById("searchInput").placeholder = "Search companies by name...";
  }

  // Update Table & Fetch
  updateTableHeaders(tab);
  fetchData(tab);
}

function updateTableHeaders(tab) {
  const headerRow = document.getElementById("tableHeaderRow");
  if (tab === "seekers") {
    headerRow.innerHTML = `
        <th class="px-6 py-4">Name & Info</th>
        <th class="px-6 py-4">Email Status</th>
        <th class="px-6 py-4">Joined At</th>
        <th class="px-6 py-4 text-right">Actions</th>
    `;
  } else {
    headerRow.innerHTML = `
        <th class="px-6 py-4">Company Name</th>
        <th class="px-6 py-4">Email Status</th>
        <th class="px-6 py-4">Verification Doc</th> <th class="px-6 py-4">Joined At</th>
        <th class="px-6 py-4 text-right">Actions</th>
    `;
  }
}

// ============================================================
// Data Fetching & Rendering
// ============================================================

async function fetchData(tab, search = "") {
  const tableBody = document.getElementById("usersTableBody");
  
  try {
    tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i> Loading...</td></tr>`;

    // 1. Determine Endpoint
    const endpoint = tab === "seekers" ? "/admin/users/seekers" : "/admin/users/companies";
    
    // 2. Call API (Using axiosClient directly or via service)
    const response = await axiosClient.get(endpoint, { params: { search } });
    const users = response.data.data.users;

    // 3. Render
    if (tab === "seekers") renderSeekers(users);
    else renderCompanies(users);

  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Failed to load data.</td></tr>`;
  }
}

function renderSeekers(users) {
  const tableBody = document.getElementById("usersTableBody");
  
  if (users.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No job seekers found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = users.map(user => {
    const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "No Name";
    const email = user.authId?.email || "N/A";
    const isVerified = user.authId?.isVerified;
    const date = new Date(user.createdAt).toLocaleDateString();

    const emailBadge = isVerified 
        ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Verified</span>`
        : `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Unverified</span>`;

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="px-6 py-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    ${name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div class="font-bold text-gray-800">${name}</div>
                    <div class="text-xs text-gray-500">${email}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4">${emailBadge}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${date}</td>
        <td class="px-6 py-4 text-right">
            <button class="delete-btn text-red-400 hover:bg-red-50 p-2 rounded-full" data-id="${user._id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderCompanies(users) {
  const tableBody = document.getElementById("usersTableBody");

  if (users.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No companies found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = users.map(user => {
    const name = user.companyName || "Unknown Company";
    const email = user.authId?.email || "N/A";
    const isEmailVerified = user.authId?.isVerified;
    const docStatus = user.verificationStatus || "unverified"; // unverified, pending, verified, rejected
    const date = new Date(user.createdAt).toLocaleDateString();

    // Badges
    const emailBadge = isEmailVerified 
        ? `<span class="text-green-600 text-xs"><i class="fas fa-check-circle"></i> Email Verified</span>`
        : `<span class="text-yellow-600 text-xs"><i class="fas fa-clock"></i> Email Pending</span>`;

    let docBadgeClass = "bg-gray-100 text-gray-600";
    if (docStatus === 'verified') docBadgeClass = "bg-blue-100 text-blue-700";
    if (docStatus === 'pending') docBadgeClass = "bg-orange-100 text-orange-700";
    if (docStatus === 'rejected') docBadgeClass = "bg-red-100 text-red-700";

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="px-6 py-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    <i class="fas fa-building"></i>
                </div>
                <div>
                    <div class="font-bold text-gray-800">${name}</div>
                    <div class="text-xs text-gray-500">${email}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4">${emailBadge}</td>
        <td class="px-6 py-4">
            <span class="${docBadgeClass} px-2 py-1 rounded text-xs font-bold uppercase">${docStatus}</span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-500">${date}</td>
        <td class="px-6 py-4 text-right">
            <button class="delete-btn text-red-400 hover:bg-red-50 p-2 rounded-full" data-id="${user._id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
      </tr>
    `;
  }).join("");
}

// ============================================================
// Actions
// ============================================================

async function handleDelete(id) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `This will permanently delete this ${currentTab === 'seekers' ? 'job seeker' : 'company'} and all their data.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "Yes, delete it!"
  });

  if (result.isConfirmed) {
    try {
      const typeParam = currentTab === 'seekers' ? 'job_seeker' : 'company';
      await axiosClient.delete(`/admin/users/${id}`, { params: { type: typeParam } });

      Swal.fire("Deleted!", "User has been removed.", "success");
      fetchData(currentTab); // Refresh
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to delete user.", "error");
    }
  }
}