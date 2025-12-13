import { companyDiscoveryService } from "../services/companyDiscoveryService.js";

// ============================================================
// Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('id');

    if (!companyId) {
        alert("No Company ID found!");
        window.location.href = "companies.html"; // Redirect back
        return;
    }

    // 2. Load Data
    await loadCompanyDetails(companyId);
});

// ============================================================
// Fetch Logic
// ============================================================
async function loadCompanyDetails(id) {
    const loader = document.getElementById('details-loader');
    const content = document.getElementById('details-content');

    try {
        // Fetch from Service
        const response = await companyDiscoveryService.getCompanyDetails(id);
        
        // Extract Data (Assuming response structure: { status: "success", data: { company: {...} } })
        // Use Optional Chaining (?.) to prevent crashes
        const company = response.data?.company || response.company; 

        if (!company) {
            throw new Error("Company data object is missing");
        }

        // Render Data
        renderCompanyData(company);

        // Show Content
        if(loader) loader.classList.add('hidden');
        if(content) content.classList.remove('hidden');

    } catch (error) {
        console.error("Error fetching company details:", error);
        if(content) {
            content.innerHTML = `
                <div class="text-center py-20">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i>
                    <p class="text-slate-500">Failed to load company details.</p>
                    <a href="companies.html" class="text-blue-600 hover:underline mt-2 block">Go Back</a>
                </div>
            `;
            content.classList.remove('hidden');
            if(loader) loader.classList.add('hidden');
        }
    }
}

// ============================================================
// Render Logic
// ============================================================
function renderCompanyData(company) {
    const safeName = company.name || company.companyName || "Unknown Company";

    // Text Fields
    setText('detail-name', safeName);
    setText('detail-industry', company.industry);
    setText('detail-location', company.location);
    setText('detail-size', company.size || company.companySize);
    setText('detail-founded', company.foundedYear);
    setText('detail-desc', company.description);
    
    // Website Button
    const webBtn = document.getElementById('detail-website');
    if(webBtn) {
        if(company.website) {
            webBtn.href = company.website;
            webBtn.classList.remove('hidden');
        } else {
            webBtn.classList.add('hidden');
        }
    }

    // Logo Logic
    const logoImg = document.getElementById('detail-logo');
    const logoInit = document.getElementById('detail-initial');
    
    if(logoImg && logoInit) {
        // Check if logo is a valid URL
        if (company.logo && company.logo !== 'url...' && company.logo.includes('http')) {
            logoImg.src = company.logo;
            logoImg.classList.remove('hidden');
            logoInit.classList.add('hidden');
        } else {
            logoImg.classList.add('hidden');
            logoInit.classList.remove('hidden');
            logoInit.innerText = safeName.charAt(0).toUpperCase();
        }
    }

    // Verified Badge
    const alertBox = document.getElementById('detail-verified-alert');
    if(alertBox) {
        if (!company.isVerified) alertBox.classList.remove('hidden');
        else alertBox.classList.add('hidden');
    }

    // Benefits Tags
    const benefitsContainer = document.getElementById('detail-benefits');
    if (company.benefits && Array.isArray(company.benefits) && company.benefits.length > 0) {
        benefitsContainer.innerHTML = company.benefits.map(b => `
            <span class="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-100 flex items-center gap-2 w-fit">
                <i class="fa-solid fa-check text-[10px]"></i> ${b}
            </span>
        `).join('');
    } else if (benefitsContainer) {
        benefitsContainer.innerHTML = '<span class="text-slate-400 text-xs italic">No specific benefits listed.</span>';
    }

    // Jobs List
    const jobsContainer = document.getElementById('detail-jobs-list');
    const jobsCount = document.getElementById('detail-jobs-count');
    const jobs = company.openPositions || [];
    
    if(jobsCount) jobsCount.innerText = jobs.length;

    if(jobsContainer) {
        if (jobs.length === 0) {
            jobsContainer.innerHTML = `
                <div class="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <i class="fa-solid fa-briefcase text-slate-300 text-2xl mb-2"></i>
                    <p class="text-slate-500 text-sm">No open positions at the moment.</p>
                </div>
            `;
        } else {
            jobsContainer.innerHTML = jobs.map(job => `
                <div class="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h5 class="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                                ${job.title}
                            </h5>
                            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                                <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">${job.type}</span>
                                <span class="flex items-center gap-1"><i class="fa-solid fa-money-bill-wave text-green-500"></i> ${job.salaryRange || 'Competitive'}</span>
                                <span class="flex items-center gap-1"><i class="fa-regular fa-clock"></i> ${formatDate(job.postedAt)}</span>
                            </div>
                        </div>
                        <button onclick="window.location.href='job-details.html?id=${job.id || job._id}'" 
                                class="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                            View Details
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Helpers
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text || 'N/A';
}

function formatDate(dateString) {
    if(!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}