import { adminService } from '../services/adminService.js';
import { authService } from '../services/authService.js';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();
  fetchJobs();
  setupEventListeners();
});

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.accountType !== 'admin') {
    window.location.href = '../../../index.html';
  }
}

function setupEventListeners() {
  // A. Search
  const searchInput = document.getElementById('searchInput');
  let timeoutId;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fetchJobs(e.target.value);
    }, 500);
  });

  // B. Refresh
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    fetchJobs(searchInput.value);
  });

  // C. Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    authService.logout();
  });

  // D. Delete Action
  document
    .getElementById('jobsTableBody')
    .addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const jobId = deleteBtn.dataset.id;
        handleDeleteJob(jobId);
      }
    });
}

// ============================================================
// Core Functions
// ============================================================

async function fetchJobs(search = '') {
  const tableBody = document.getElementById('jobsTableBody');

  try {
    tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin mr-2 text-blue-500"></i> Loading jobs...
            </td>
        </tr>
    `;

    const data = await adminService.getAllJobs({ search });
    const jobs = data.data.jobs;

    renderJobs(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="px-6 py-8 text-center text-red-500">
                Failed to load jobs.
            </td>
        </tr>
    `;
  }
}

function renderJobs(jobs) {
  const tableBody = document.getElementById('jobsTableBody');

  if (jobs.length === 0) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                No jobs found.
            </td>
        </tr>
    `;
    return;
  }

  tableBody.innerHTML = jobs
    .map((job) => {
      // 1. Job Info
      const date = new Date(job.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // 2. Company Info (Handle if company was deleted but job exists)
      const companyName = job.companyId?.companyName || 'Unknown Company';
      const companyLogo = job.companyId?.logoUrl
        ? job.companyId.logoUrl
        : 'https://via.placeholder.com/40';

      return `
        <tr class="hover:bg-gray-50 transition border-b border-gray-100">
            <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span class="font-bold text-gray-800 text-sm">${job.title}</span>
                    <span class="text-xs text-blue-500 mt-1">${job.type} • ${job.location}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <img src="${companyLogo}" alt="Logo" class="w-8 h-8 rounded object-cover border border-gray-200">
                    <span class="text-sm font-medium text-gray-700">${companyName}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${date}
            </td>
            <td class="px-6 py-4 text-right">
                <button 
                    class="delete-btn text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition" 
                    data-id="${job._id}" 
                    title="Delete Job"
                >
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
      `;
    })
    .join('');
}

async function handleDeleteJob(jobId) {
  const result = await Swal.fire({
    title: 'Delete Job?',
    text: 'This job post will be permanently removed.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Yes, delete it!',
  });

  if (result.isConfirmed) {
    try {
      await adminService.deleteJob(jobId);
      await Swal.fire('Deleted!', 'Job has been removed.', 'success');
      fetchJobs(document.getElementById('searchInput').value);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to delete job.', 'error');
    }
  }
}
