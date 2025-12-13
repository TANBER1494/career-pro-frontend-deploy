document.body.classList.add('loaded');
import { jobService } from "../services/jobService.js";
import { companyDiscoveryService } from "../services/companyDiscoveryService.js";
import { authService } from "../services/authService.js";

// ============================================================
// 1. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  initAuthButtons();
  initNavbarScrolling();
  initSearch();

  loadFeaturedJobs();
  loadTopCompanies();

  initModalEvents();
});

// ============================================================
// 2. Auth State & Navigation Logic
// ============================================================
function initAuthButtons() {
  const authContainer = document.getElementById("auth-buttons-container");
  if (!authContainer) return;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (token && user) {
    // تحديد الرابط والاسم والأيقونة حسب نوع الحساب
    let navLinkHtml = "";

    if (user.accountType === "company") {
      // للشركة: Dashboard
      authService.logout();
    } else {
      // ✅ تم تصحيح المسار هنا (إضافة مجلد profile)
      navLinkHtml = `
                <a href="/src/pages/seeker/profile/profile.html" class="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-2 transition duration-300 ">
                    <i class="fas fa-user-circle text-lg"></i> Profile
                </a>`;
    }

    // حقن الكود في النافبار
    authContainer.innerHTML = `
            ${navLinkHtml}
            <button
          id="btnLogout"
          class="text-gray-600 hover:text-red-600 font-bold flex items-center gap-2 transition duration-300"
        >
          <i class="fas fa-sign-out-alt"></i> Log out
        </button>
        `;

    document.getElementById("btnLogout").addEventListener("click", () => {
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

function initNavbarScrolling() {
  // نحدد فقط عناصر القائمة السحرية (التي تعمل كسكرول)
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault(); // نمنع الانتقال لأننا نريد سكرول

      // 1. تفعيل العنصر النشط
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      // 2. السكرول للقسم في نفس الصفحة
      const targetId = item.dataset.target; // home, services, companies, jobs
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function initSearch() {
  // زرار البحث في الهيرو
  const searchBtn = document.getElementById("heroSearchBtn");
  const searchInput = document.getElementById("heroSearchInput");

  const performSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `/jobs.html?search=${encodeURIComponent(query)}`;
    }
  };

  if (searchBtn) searchBtn.addEventListener("click", performSearch);
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performSearch();
    });
  }

  // زرار Browse Jobs (سكرول داخلي)
  const browseBtn = document.getElementById("browseJobsBtn");
  if (browseBtn) {
    browseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // زرار Start Career (فحص حالة الدخول)
  const startBtn = document.getElementById("startCareerBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const token = localStorage.getItem("token");
      if (token) {
        document
          .getElementById("services")
          ?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "/src/pages/auth/signup-login.html?mode=signup";
      }
    });
  }
}
// ============================================================
// 3. Load Featured Jobs
// ============================================================
async function loadFeaturedJobs() {
  const container = document.getElementById("featured-jobs-container");
  if (!container) return;

  try {
    const response = await jobService.getAllJobs({ limit: 6 });
    const jobs = response.data.jobs || [];

    container.innerHTML = "";

    if (jobs.length === 0) {
      container.innerHTML =
        '<p class="col-span-full text-center text-slate-500">No jobs available at the moment.</p>';
      return;
    }

    jobs.forEach((job, index) => {
      container.insertAdjacentHTML("beforeend", createJobCard(job, index + 1));
    });
  } catch (error) {
    console.error("Jobs Error:", error);
    container.innerHTML =
      '<p class="col-span-full text-center text-red-400">Failed to load jobs.</p>';
  }
}

function createJobCard(job, index) {
  const timeAgo = getTimeAgo(job.postedAt);

  const companyObj = job.company || {};
  const companyName =
    companyObj.name || companyObj.companyName || "Hiring Company";
  const companyLogo = companyObj.logo || "https://placehold.co/48x48?text=Logo";
  const location = job.location || companyObj.location || "Remote";

  const saveIconClass = job.isSaved
    ? "fa-solid text-blue-600"
    : "fa-regular text-slate-400";

  const skillsHTML = (job.skills || [])
    .slice(0, 3)
    .map(
      (skill) =>
        `<span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">${skill}</span>`
    )
    .join("");

  return `
    <div class="bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative group border border-slate-100 flex flex-col h-full">
        
        <button onclick="toggleSaveJob('${
          job.id || job._id
        }', this)" class="absolute top-5 left-5 hover:text-blue-600 transition-colors z-20" title="Save Job">
            <i class="${saveIconClass} fa-bookmark text-lg"></i>
        </button>

        <div class="flex items-start gap-4 mb-4 mt-6">
            <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden shrink-0 border border-blue-100">
                <img src="${companyLogo}" alt="${companyName}" class="w-full h-full object-cover">
            </div>
            <div>
                <h3 class="font-medium font-poppins text-slate-900 leading-tight line-clamp-1" title="${
                  job.title
                }">${job.title}</h3>
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span><i class="fa-regular fa-building mr-1"></i> ${companyName}</span>
                    <span><i class="fa-solid fa-location-dot mr-1"></i> ${location}</span>
                </div>
            </div>
        </div>

        <p class="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed flex-grow">
            ${job.description || "No description available."}
        </p>

        <div class="flex flex-wrap gap-2 mb-4 h-6 overflow-hidden">
            ${skillsHTML}
        </div>

        <div class="flex items-center justify-between mb-4 mt-auto">
            <span class="text-green-600 font-semibold font-poppins text-sm">${
              job.salaryRange || "Competitive"
            }</span>
            <span class="text-slate-400 text-xs"><i class="fa-regular fa-clock mr-1"></i> ${timeAgo}</span>
        </div>

        <button onclick="applyForJobCheck('${
          job.id || job._id
        }')" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-blue-500/20 shadow-sm">
            Apply Now
        </button>
    </div>
    `;
}

// ============================================================
// 4. Load Top Companies
// ============================================================
async function loadTopCompanies() {
  const container = document.getElementById("top-companies-container");
  if (!container) return;

  try {
    const response = await companyDiscoveryService.getTopCompanies({
      limit: 6,
    });
    const companies = response.data.companies || [];

    container.innerHTML = "";

    if (companies.length === 0) {
      container.innerHTML =
        '<p class="col-span-full text-center text-slate-500">No companies found.</p>';
      return;
    }

    companies.forEach((company) => {
      container.insertAdjacentHTML("beforeend", createCompanyCard(company));
    });
  } catch (error) {
    console.error("Companies Error:", error);
    container.innerHTML =
      '<p class="col-span-full text-center text-red-400">Failed to load companies.</p>';
  }
}

function createCompanyCard(company) {
  const logo = company.logo || "https://placehold.co/64x64?text=C";
  const name = company.name || company.companyName || "Company Name";
  const initial = name.charAt(0).toUpperCase();
  const desc =
    company.description || company.about || "No description available.";
  const shortDesc = desc.length > 100 ? desc.substring(0, 100) + "..." : desc;
  const location = company.location || "Remote";
  const industry = company.industry || "Tech";
  const positions = company.openPositionsCount || 0;
  const detailsLink = `/company-details.html?id=${company.id || company._id}`;

  return `
    <div class="flex flex-col gap-3 group">
        <div class="companyCard">
            <div class="companyCard-inner">
                <div class="companyCard-front bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative group h-full">
                    <div class="absolute top-4 right-4 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">
                        <i class="fa-solid fa-shield"></i>
                    </div>
                    
                    <div class="flex flex-col items-center text-center h-full justify-center">
                        <div class="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-blue-500/30 overflow-hidden">
                            ${
                              company.logo
                                ? `<img src="${logo}" class="w-full h-full object-cover">`
                                : initial
                            }
                        </div>
                        
                        <h3 class="font-medium font-poppins text-lg mb-1 flex items-center gap-2 justify-center">
                            ${name}
                            ${
                              company.isVerified
                                ? '<span class="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-medium">Verified</span>'
                                : ""
                            }
                        </h3>
                        
                        <p class="text-slate-500 text-sm mb-3">${industry}</p>
                        
                        <div class="text-slate-400 text-xs flex items-center gap-1 mb-4">
                            <i class="fa-solid fa-location-dot"></i> ${location}
                        </div>
                        
                        <a class="text-blue-600 text-sm font-normal mb-4 cursor-pointer">
                            ${positions} Open Positions
                        </a>
                    </div>
                </div>
                
                <div class="companyCard-back bg-white p-6 rounded-xl shadow-md flex flex-col justify-center text-center border border-slate-200">
                    <h3 class="text-lg font-semibold mb-3 text-slate-800">About Company</h3>
                    <p class="text-sm text-slate-600 leading-relaxed mb-4">
                        ${shortDesc}
                    </p>
                </div>

            </div>
        </div>
        
        <button onclick="window.location.href='companyDetails.html?id=${company.id || company._id}'" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-blue-500/20 shadow-sm">
            View Jobs
        </button>
    </div>
    `;
}

// ============================================================
// 5. Actions (Global Helpers)
// ============================================================

window.applyForJobCheck = function (jobId) {
  const token = localStorage.getItem("token");

  if (!token) {
    Swal.fire({
      icon: "info",
      title: "Login Required",
      text: "You need to login to apply for jobs.",
      showCancelButton: true,
      confirmButtonText: "Login Now",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/src/pages/auth/signup-login.html";
      }
    });
    return;
  }

  const modal = document.getElementById("applyModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.dataset.jobId = jobId;
  }
};

window.toggleSaveJob = async function (jobId, btnElement) {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire("Login Required", "Please login to save jobs.", "info");
    return;
  }

  try {
    const icon = btnElement.querySelector("i");
    const isCurrentlySaved = icon.classList.contains("fa-solid");

    if (isCurrentlySaved) {
      icon.classList.remove("fa-solid", "text-blue-600");
      icon.classList.add("fa-regular", "text-slate-400");
    } else {
      icon.classList.remove("fa-regular", "text-slate-400");
      icon.classList.add("fa-solid", "text-blue-600");
    }

    await jobService.toggleSaveJob(jobId);
  } catch (error) {
    console.error("Save Error:", error);
    Swal.fire("Error", "Failed to save job.", "error");
  }
};

window.closeApplyModal = function () {
  document.getElementById("applyModal").classList.add("hidden");
};

function initModalEvents() {
  const modal = document.getElementById("applyModal");
  const closeBtn = document.getElementById("btnCloseModal");
  const cancelBtn = document.getElementById("btnCancelModal");
  const form = document.getElementById("applyForm");

  const close = () => modal && modal.classList.add("hidden");
  if (closeBtn) closeBtn.onclick = close;
  if (cancelBtn) cancelBtn.onclick = close;

  window.onclick = (e) => {
    if (e.target === modal) close();
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      Swal.fire("Success", "Application submitted successfully!", "success");
      close();
    });
  }
}

// Helper: Time Ago
function getTimeAgo(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  return "Today";
}
function initScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navItems = document.querySelectorAll(".nav-item");

  function onScroll() {
    let maxVisibleHeight = 0;
    let currentId = "";

    const windowHeight = window.innerHeight;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();

      // 1. حساب الجزء الظاهر من السكشن بالبيكسل
      // (نهاية الجزء الظاهر - بداية الجزء الظاهر)
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(windowHeight, rect.bottom);
      
      // ارتفاع الجزء الظاهر حالياً من هذا السكشن
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      // 2. مقارنة: هل السكشن ده واخد مساحة أكبر من اللي قبله؟
      // بنحط شرط (visibleHeight > maxVisibleHeight) عشان نختار "الملك" المسيطر على الشاشة
      // الرقم 100 ده "فلتر" عشان يتجاهل الأجزاء الصغيرة جداً لو ظهرت بالغلط
      if (visibleHeight > maxVisibleHeight && visibleHeight > 100) {
        maxVisibleHeight = visibleHeight;
        currentId = section.getAttribute("id");
      }
    });

    // 3. تحديث النافبار
    if (currentId) {
      navItems.forEach((li) => {
        li.classList.remove("active");
        if (li.dataset.target === currentId) {
          li.classList.add("active");
        }
      });
    }
  }

  // تشغيل الدالة عند السكرول
  window.addEventListener("scroll", onScroll);
  // تشغيلها مرة واحدة عند التحميل
  onScroll();
}
// ============================================================
// 1. Initialization
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add('loaded');

  initAuthButtons();
  initNavbarScrolling(); // ده بتاع الكليك
  initScrollSpy();       // 🔥 ضيفي ده عشان يشتغل مع السكرول
  initSearch();

  loadFeaturedJobs();
  loadTopCompanies();

  initModalEvents();
});


const Cbtn = document.getElementById('companiesBtn');
// بنعمل شرط عشان لو الزرار مش موجود في الصفحة دي ميديناش ايرور
if (Cbtn) {
    Cbtn.addEventListener('click', function(e) {
        e.preventDefault(); // وقف الانتقال الفوري
        // شيل كلاس الظهور (فالصفحة ترجع شفافة تاني)
        document.body.classList.remove('loaded');
        // استنى نص ثانية (500ms) وبعدين روح للصفحة الجديدة
        setTimeout(() => {
            window.location.href = this.href;
        }, 400);
    });
}

// 1. أول ما الصفحة تفتح، بنخليها تظهر (Fade In)
// بنستنى جزء من الثانية عشان المتصفح يلحق يرسم الصفحة
window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
});
// 2. كود الزرار (Fade Out)
const Jbtn = document.getElementById('jobsBtn');
// بنعمل شرط عشان لو الزرار مش موجود في الصفحة دي ميديناش ايرور
if (Jbtn) {
    Jbtn.addEventListener('click', function(e) {
        e.preventDefault(); // وقف الانتقال الفوري
        // شيل كلاس الظهور (فالصفحة ترجع شفافة تاني)
        document.body.classList.remove('loaded');
        // استنى نص ثانية (500ms) وبعدين روح للصفحة الجديدة
        setTimeout(() => {
            window.location.href = this.href;
        }, 400);
    });
}

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
});
const bbtn = document.getElementById('backBtn');
// بنعمل شرط عشان لو الزرار مش موجود في الصفحة دي ميديناش ايرور
if (bbtn) {
    bbtn.addEventListener('click', function(e) {
        e.preventDefault(); // وقف الانتقال الفوري
        // شيل كلاس الظهور (فالصفحة ترجع شفافة تاني)
        document.body.classList.remove('loaded');
        // 4. استنى نص ثانية (500ms) عشان تماثل وقت الـ CSS
        // لو خليتها 200 والـ CSS 500 الحركة هتقطع
        setTimeout(() => {
            window.location.href = this.href;
        }, 400);
    });
}
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
});
const Sbtn = document.getElementById('serviceBtn');
// بنعمل شرط عشان لو الزرار مش موجود في الصفحة دي ميديناش ايرور
if (Sbtn) {
    Sbtn.addEventListener('click', function(e) {
        e.preventDefault(); // وقف الانتقال الفوري
        // شيل كلاس الظهور (فالصفحة ترجع شفافة تاني)
        document.body.classList.remove('loaded');
        // 4. استنى نص ثانية (500ms) عشان تماثل وقت الـ CSS
        // لو خليتها 200 والـ CSS 500 الحركة هتقطع
        setTimeout(() => {
            window.location.href = this.href;
        }, 400);
    });
}