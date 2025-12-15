import { companyDiscoveryService } from "../services/companyDiscoveryService.js";

// ============================================================
// 1. Elements & State
// ============================================================
const container = document.getElementById("companies-container");
const countLabel = document.getElementById("companies-count");
const verifiedBadge = document.getElementById("verified-count-badge");
const verifiedCountLabel = document.getElementById("verified-count");
// Filters
const searchInput = document.getElementById("search-input");
const filterIndustry = document.getElementById("filter-industry");
const filterLocation = document.getElementById("filter-location");
const filterVerified = document.getElementById("filter-verified");

// State
let currentFilters = {
  search: "",
  industry: "",
  location: "",
  isVerified: "",
  page: 1,
  limit: 500,
};
let allFetchedCompanies = [];
const itemsPerPage = 12;
let searchTimeout = null; // For Debouncing

// ============================================================
// 2. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadCompanies();
  setupEventListeners();
  ensurePaginationHTML();
});
function ensurePaginationHTML() {
  // لو الكونتينر مش موجود في الصفحة، اخلقه تحت قائمة الشركات
  let pagContainer = document.getElementById("pagination-container");
  if (!pagContainer && container) {
    pagContainer = document.createElement("div");
    pagContainer.id = "pagination-container";
    pagContainer.className = "flex justify-center items-center gap-4 mt-8 mb-8";
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
      verifiedBadge.classList.remove("hidden");
      verifiedCountLabel.textContent = verifiedCount;
    } else {
      verifiedBadge.classList.add("hidden");
    }

    renderCompanies();
    updatePaginationUI(allFetchedCompanies.length);
  } catch (error) {
    console.error("Companies List Error:", error);
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
  container.innerHTML = "";

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
    container.insertAdjacentHTML("beforeend", createCompanyCard(company));
  });
}
function updatePaginationUI(totalItems) {
  const pagContainer = document.getElementById("pagination-container");
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
          ${isFirstPage ? "disabled" : ""}>
          <i class="fas fa-chevron-left mr-1"></i> Previous
      </button>
      
      <span class="text-sm text-gray-600 font-medium px-2">
          Page ${currentFilters.page} of ${totalPages}
      </span>

      <button id="nextBtn" 
          class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          ${isLastPage ? "disabled" : ""}>
          Next <i class="fas fa-chevron-right ml-1"></i>
      </button>
  `;

  // إعادة ربط الأحداث
  document
    .getElementById("prevBtn")
    ?.addEventListener("click", () => changePage(-1));
  document
    .getElementById("nextBtn")
    ?.addEventListener("click", () => changePage(1));
}
function changePage(direction) {
  // تحديث رقم الصفحة
  currentFilters.page += direction;

  // التأكد من الحدود
  // (ممكن نضيف شرط هنا عشان ميزدش عن آخر صفحة لو حبيتي)
  if (currentFilters.page < 1) currentFilters.page = 1;

  // سكرول لأعلى الصفحة
  window.scrollTo({ top: 0, behavior: "smooth" });

  // ⚠️ التغيير هنا: مبقناش بننادي loadCompanies
  // بننادي renderCompanies وتحديث الزراير بس
  renderCompanies();
  updatePaginationUI(allFetchedCompanies.length);
}

function createCompanyCard(company) {
  // ... (نفس المتغيرات اللي فوق زي ما هي)
  const name = company.name || company.companyName || "Unknown Company";
  let logo = "https://placehold.co/64x64?text=C";
  if (company.logo && !company.logo.includes("url...")) {
    logo = company.logo.startsWith("http")
      ? company.logo
      : `http://localhost:3000${company.logo}`;
  }
  const initial = name.charAt(0).toUpperCase();
  const industry = company.industry || "Technology";
  const location = company.location || "Remote";
  const size = company.companySize || company.size || "N/A";
  const positions = company.openPositionsCount || 0;

  // Verified Badge logic...
  const verifiedBadgeHtml = company.isVerified
    ? `<div class="absolute top-4 right-4 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs" title="Verified Company"><i class="fa-solid fa-shield"></i></div>`
    : "";

  const verifiedTag = company.isVerified
    ? `<span class="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded ml-1">Verified</span>`
    : "";

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

            <button onclick="window.location.href='../../pages/public companies/companyDetails.html?id=${
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
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value.trim();
        currentFilters.page = 1;
        loadCompanies();
      }, 500);
    });
  }

  if (filterIndustry) {
    filterIndustry.addEventListener("change", (e) => {
      currentFilters.industry = e.target.value;
      currentFilters.page = 1;
      loadCompanies();
    });
  }

  if (filterLocation) {
    filterLocation.addEventListener("change", (e) => {
      currentFilters.location = e.target.value;
      currentFilters.page = 1;
      loadCompanies();
    });
  }

  if (filterVerified) {
    filterVerified.addEventListener("change", (e) => {
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
