import { companyDiscoveryService } from '../services/companyDiscoveryService.js';
import { authService } from '../services/authService.js';
document.addEventListener('DOMContentLoaded', () => {
  initAuthButtons();
});
// ============================================================
// 1. Elements & State
// ============================================================
const container = document.getElementById('companies-container');
const countLabel = document.getElementById('companies-count');
const verifiedBadge = document.getElementById('verified-count-badge');
const verifiedCountLabel = document.getElementById('verified-count');
// Filters
const searchInput = document.getElementById('search-input');
const filterIndustry = document.getElementById('filter-industry');
const filterLocation = document.getElementById('filter-location');
const filterVerified = document.getElementById('filter-verified');

// State
let currentFilters = {
  search: '',
  industry: '',
  location: '',
  isVerified: '',
  page: 1,
  limit: 500,
};
let allFetchedCompanies = [];
const itemsPerPage = 12;
let searchTimeout = null; // For Debouncing

// ============================================================
// 2. Initialization
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadCompanies();
  setupEventListeners();
  ensurePaginationHTML();
});
function ensurePaginationHTML() {
  // لو الكونتينر مش موجود في الصفحة، اخلقه تحت قائمة الشركات
  let pagContainer = document.getElementById('pagination-container');
  if (!pagContainer && container) {
    pagContainer = document.createElement('div');
    pagContainer.id = 'pagination-container';
    pagContainer.className = 'flex justify-center items-center gap-4 mt-8 mb-8';
    container.parentNode.appendChild(pagContainer);
  }
}
// ============================================================
// 3. Logic: Fetch Data (Listing)
// ============================================================
async function loadCompanies() {
  if (!container) return;

  // Show Loading
  container.innerHTML = `
        <div class="col-span-full text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
            <p class="mt-2 text-gray-500">Finding companies...</p>
        </div>
    `;

  try {
    const params = { ...currentFilters };
    params.page = 1;
    if (!params.search) delete params.search;
    if (!params.industry) delete params.industry;
    if (!params.location) delete params.location;
    if (!params.isVerified) delete params.isVerified;
    const response = await companyDiscoveryService.getAllCompanies(params);
    const companies = response.data.companies || [];
    const totalCount = response.results || companies.length;
    allFetchedCompanies = response.data.companies || [];
    // Update UI Counts
    if (countLabel)
      countLabel.textContent = `Showing ${companies.length} results`;

    // Update Verified Badge
    const verifiedCount = companies.filter((c) => c.isVerified).length;
    if (verifiedCount > 0) {
      verifiedBadge.classList.remove('hidden');
      verifiedCountLabel.textContent = verifiedCount;
    } else {
      verifiedBadge.classList.add('hidden');
    }

    renderCompanies();
    updatePaginationUI(allFetchedCompanies.length);
  } catch (error) {
    console.error('Companies List Error:', error);
    container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-circle text-4xl text-red-400"></i>
                <p class="mt-2 text-gray-500">Failed to load companies. Please try again.</p>
            </div>
        `;
  }
}

// ============================================================
// 4. Logic: Render Cards (Updated for Pagination)
// ============================================================
function renderCompanies() {
  // مبقتش محتاجة تستقبل parameter
  container.innerHTML = '';

  // نستخدم المتغير العام اللي فيه الداتا
  const companies = allFetchedCompanies;

  if (companies.length === 0) {
    // ... (كود No companies found زي ما هو) ...
    return;
  }

  // حساب البداية والنهاية (Slicing)
  const start = (currentFilters.page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const companiesToShow = companies.slice(start, end);

  companiesToShow.forEach((company) => {
    container.insertAdjacentHTML('beforeend', createCompanyCard(company));
  });
}
function updatePaginationUI(totalItems) {
  const pagContainer = document.getElementById('pagination-container');
  if (!pagContainer) return;

  // حساب عدد الصفحات الكلي (مثلاً 100 شركة / 9 في الصفحة = 12 صفحة)
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // حالة الأزرار
  const isFirstPage = currentFilters.page === 1;
  const isLastPage = currentFilters.page >= totalPages; // تعديل الشرط هنا

  // رسم الأزرار
  pagContainer.innerHTML = `
      <button id="prevBtn" 
          class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          ${isFirstPage ? 'disabled' : ''}>
          <i class="fas fa-chevron-left mr-1"></i> Previous
      </button>
      
      <span class="text-sm text-gray-600 font-medium px-2">
          Page ${currentFilters.page} of ${totalPages}
      </span>

      <button id="nextBtn" 
          class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          ${isLastPage ? 'disabled' : ''}>
          Next <i class="fas fa-chevron-right ml-1"></i>
      </button>
  `;

  // إعادة ربط الأحداث
  document
    .getElementById('prevBtn')
    ?.addEventListener('click', () => changePage(-1));
  document
    .getElementById('nextBtn')
    ?.addEventListener('click', () => changePage(1));
}
function changePage(direction) {
  // تحديث رقم الصفحة
  currentFilters.page += direction;

  // التأكد من الحدود
  // (ممكن نضيف شرط هنا عشان ميزدش عن آخر صفحة لو حبيتي)
  if (currentFilters.page < 1) currentFilters.page = 1;

  // سكرول لأعلى الصفحة
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // ⚠️ التغيير هنا: مبقناش بننادي loadCompanies
  // بننادي renderCompanies وتحديث الزراير بس
  renderCompanies();
  updatePaginationUI(allFetchedCompanies.length);
}

function createCompanyCard(company) {
  // ... (نفس المتغيرات اللي فوق زي ما هي)
  const name = company.name || company.companyName || 'Unknown Company';
  let logo = 'https://placehold.co/64x64?text=C';
  // التغيير: نستخدم اللوجو مباشرة لو موجود
  if (company.logo) {
    logo = company.logo;
  }
  const initial = name.charAt(0).toUpperCase();
  const industry = company.industry || 'Technology';
  const location = company.location || 'Remote';
  const size = company.companySize || company.size || 'N/A';
  const positions = company.openPositionsCount || 0;

  // Verified Badge logic...
  const verifiedBadgeHtml = company.isVerified
    ? `<div class="absolute top-4 right-4 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs" title="Verified Company"><i class="fa-solid fa-shield"></i></div>`
    : '';

  const verifiedTag = company.isVerified
    ? `<span class="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded ml-1">Verified</span>`
    : '';

  return `
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 relative hover:shadow-md transition group">
        
        ${verifiedBadgeHtml}

        <div class="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-xl font-bold mx-auto mb-4 overflow-hidden border border-blue-100">
            ${
              company.logo
                ? `<img src="${logo}" class="w-full h-full object-cover">`
                : initial
            }
        </div>

        <div class="text-center">
            <div class="flex items-center justify-center gap-1 mb-1">
                <h3 class="font-medium font-poppins text-gray-900 line-clamp-1" title="${name}">
                    ${name}
                </h3>
                ${verifiedTag}
            </div>
            
            <p class="text-xs text-gray-500 mb-3 line-clamp-1">${industry}</p>

            <span class="inline-block border border-gray-200 text-gray-500 text-xs px-2 py-1 rounded-md mb-4 bg-gray-50">
                ${industry}
            </span>

            <div class="flex flex-col gap-1 text-xs text-gray-500 mb-4">
                <div class="flex items-center justify-center gap-1">
                    <i class="fa-solid fa-location-dot text-gray-400"></i> ${location}
                </div>
                <div class="flex items-center justify-center gap-1">
                    <i class="fa-solid fa-users text-gray-400"></i> ${size}
                </div>
            </div>

            <a class="text-blue-600 text-xs font-medium mb-4 block">
                ${positions} Open Positions
            </a>

            <button onclick="window.location.href='../../pages/public companies/company-details?id=${
              company.id || company._id
            }'"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition shadow-blue-500/20 shadow-sm">
                View Company
            </button>
        </div>
    </div>
    `;
}
// ============================================================
// 5. Logic: Event Listeners (Filters)
// ============================================================
function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value.trim();
        currentFilters.page = 1;
        loadCompanies();
      }, 500);
    });
  }

  if (filterIndustry) {
    filterIndustry.addEventListener('change', (e) => {
      currentFilters.industry = e.target.value;
      currentFilters.page = 1;
      loadCompanies();
    });
  }

  if (filterLocation) {
    filterLocation.addEventListener('change', (e) => {
      currentFilters.location = e.target.value;
      currentFilters.page = 1;
      loadCompanies();
    });
  }

  if (filterVerified) {
    filterVerified.addEventListener('change', (e) => {
      currentFilters.isVerified = e.target.value;
      currentFilters.page = 1;
      loadCompanies();
    });
  }
}

function applyForJob(jobId) {
  // Redirect to job details page
  window.location.href = `job-details.html?id=${jobId}`;
}

// ============================================================
// 7. Make Functions Globally Accessible
// ============================================================
window.applyForJob = applyForJob;
function initAuthButtons() {
  const authContainer = document.getElementById('auth-buttons-container');
  if (!authContainer) return;
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  authContainer.className = 'flex items-center gap-3 justify-end';
  if (token && user) {
    // تحديد الرابط والاسم والأيقونة حسب نوع الحساب
    let navLinkHtml = '';

    if (user.accountType === 'company') {
      // للشركة: Dashboard
      authService.logout();
    } else {
      navLinkHtml = `
          <a id="profileBtn" href="/src/pages/seeker/profile/profile.html" class="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-2 transition duration-300 whitespace-nowrap">
            <i class="fas fa-user-circle text-lg"></i> Profile
        </a>`;
    }

    // حقن الكود في النافبار
    authContainer.innerHTML = `
            ${navLinkHtml}
            <div class="min-w-[150px] flex justify-end">
        <button 
        id="btnLogout"
  class="group flex items-center justify-start w-11 h-11 bg-red-600 rounded-full cursor-pointer relative overflow-hidden transition-all duration-500 shadow-lg hover:w-32 hover:rounded-3xl active:translate-x-1 active:translate-y-1"
>
  <div
    class="flex items-center justify-center w-full transition-all duration-300 group-hover:justify-start group-hover:px-3"
  >
    <svg class="w-4 h-4" viewBox="0 0 512 512" fill="white">
      <path
        d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
      ></path>
    </svg>
  </div>
  <div
    class="absolute right-5 transform translate-x-full opacity-0 text-white text-lg font-semibold transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
  >
    Logout
  </div>
</button>

      </div>
        `;

    document.getElementById('btnLogout').addEventListener('click', () => {
      authService.logout();
    });
  } else {
    // للزائر
    authContainer.innerHTML = `
            <a href="/src/pages/auth/signup-login.html" class="text-sm font-medium text-slate-600 hover:text-blue-600">Login</a>
            <a href="/src/pages/auth/signup-login.html?mode=signup" class="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition shadow-md shadow-blue-500/30">Sign Up</a>
        `;
  }
}
window.addEventListener('load', function () {
  document.body.classList.add('loaded');
});
document.addEventListener('click', function (e) {
  const profileBtn = e.target.closest('#profileBtn');
  if (profileBtn) {
    e.preventDefault();
    const targetUrl = profileBtn.getAttribute('href');
    document.body.classList.remove('loaded');
    setTimeout(function () {
      window.location.href = targetUrl;
    }, 350);
  }
});
