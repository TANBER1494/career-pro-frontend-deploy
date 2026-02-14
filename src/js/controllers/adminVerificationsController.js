import { adminService } from '../services/adminService.js';
import { authService } from '../services/authService.js';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();

  // Load initial data (Pending by default)
  fetchVerifications('pending');

  setupEventListeners();
});

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.accountType !== 'admin') {
    window.location.href = '../../../index.html';
  }
}

function setupEventListeners() {
  // A. Filter Change
  const statusFilter = document.getElementById('statusFilter');
  statusFilter.addEventListener('change', (e) => {
    fetchVerifications(e.target.value);
  });

  // B. Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    authService.logout();
  });

  // C. Table Actions (View, Approve, Reject)
  document
    .getElementById('verificationsTableBody')
    .addEventListener('click', async (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      const docId = target.dataset.id;
      const action = target.dataset.action; // 'approve' or 'reject'

      if (action === 'approve') {
        handleApprove(docId);
      } else if (action === 'reject') {
        handleReject(docId);
      }
    });
}

// ============================================================
// Core Functions
// ============================================================

async function fetchVerifications(status) {
  const tableBody = document.getElementById('verificationsTableBody');

  try {
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin mr-2 text-blue-500"></i> Loading...
            </td>
        </tr>
    `;

    const data = await adminService.getVerificationRequests(status);
    const requests = data.data.requests; // حسب رد الباك إند

    renderRequests(requests, status);
  } catch (error) {
    console.error('Error fetching requests:', error);
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-8 text-center text-red-500">
                Failed to load data.
            </td>
        </tr>
    `;
  }
}

function renderRequests(requests, currentStatus) {
  const tableBody = document.getElementById('verificationsTableBody');

  if (requests.length === 0) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                No ${currentStatus} requests found.
            </td>
        </tr>
    `;
    return;
  }

  tableBody.innerHTML = requests
    .map((req) => {
      // Company Info (Populated)
      const companyName = req.companyId?.companyName || 'Unknown Company';
      const industry = req.companyId?.industry || 'N/A';
      const location = req.companyId?.location || 'N/A';

      // File Info
      // نفترض أن الباك إند بيرجع filePath كامل أو نسبي
      const fileUrl = `http://localhost:3000${req.filePath || req.documentUrl}`;

      // Date
      const dateProperty = req.uploadedAt || req.createdAt; // (احتياطاً لو غيرت الموديل مستقبلاً)

      const date = new Date(dateProperty).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Decision Buttons (Show only if status is pending)
      let actionsHtml = '';
      if (currentStatus === 'pending') {
        actionsHtml = `
            <div class="flex justify-end gap-2">
                <button 
                    class="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-lg transition" 
                    data-id="${req._id}" 
                    data-action="approve"
                    title="Approve"
                >
                    <i class="fas fa-check"></i>
                </button>
                <button 
                    class="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-lg transition" 
                    data-id="${req._id}" 
                    data-action="reject"
                    title="Reject"
                >
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
      } else {
        // Show static status if not pending
        const badgeColor =
          currentStatus === 'approved' ? 'text-green-600' : 'text-red-600';
        actionsHtml = `<span class="font-bold uppercase text-xs ${badgeColor}">${currentStatus}</span>`;
      }

      return `
        <tr class="hover:bg-gray-50 transition border-b border-gray-100">
            <td class="px-6 py-4">
                <div>
                    <div class="font-bold text-gray-800">${companyName}</div>
                    <div class="text-xs text-gray-500">${industry} • ${location}</div>
                </div>
            </td>
            <td class="px-6 py-4">
                <a href="${fileUrl}" target="_blank" class="flex items-center gap-2 text-blue-600 hover:underline">
                    <i class="fas fa-file-pdf text-red-500"></i>
                    <span class="text-xs font-medium truncate w-32">View Document</span>
                </a>
            </td>
            <td class="px-6 py-4">
               <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase">${req.verificationStatus}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${date}
            </td>
            <td class="px-6 py-4 text-right">
                ${actionsHtml}
            </td>
        </tr>
      `;
    })
    .join('');
}

// --- Actions Logic ---

async function handleApprove(docId) {
  const result = await Swal.fire({
    title: 'Approve Company?',
    text: "This company will be marked as 'Verified' and get a blue badge.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#16a34a',
    confirmButtonText: 'Yes, Approve',
  });

  if (result.isConfirmed) {
    try {
      await adminService.reviewCompany(docId, 'approved');

      await Swal.fire('Approved!', 'Company has been verified.', 'success');

      // Refresh List
      fetchVerifications('pending');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to approve company.', 'error');
    }
  }
}

async function handleReject(docId) {
  // Show input dialog for reason
  const { value: reason } = await Swal.fire({
    title: 'Reject Verification',
    input: 'textarea',
    inputLabel: 'Rejection Reason',
    inputPlaceholder: 'e.g., Document is blurry, Tax ID mismatch...',
    inputAttributes: {
      'aria-label': 'Type your rejection reason here',
    },
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Reject',
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write a reason!';
      }
    },
  });

  if (reason) {
    try {
      await adminService.reviewCompany(docId, 'rejected', reason);

      await Swal.fire(
        'Rejected',
        'Company verification has been rejected.',
        'info'
      );

      // Refresh List
      fetchVerifications('pending');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to reject request.', 'error');
    }
  }
}
