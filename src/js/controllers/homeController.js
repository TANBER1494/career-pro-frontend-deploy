document.body.classList.add("loaded");
import { jobService } from "../services/jobService.js";
import { companyDiscoveryService } from "../services/companyDiscoveryService.js";
import { authService } from "../services/authService.js";
import Swal from "sweetalert2";
import { initPixelBlast } from './pixelBlast.js';

initPixelBlast('#pixel-blast-container', {
    // تقدري تعدلي الإعدادات هنا زي ما كنتي بتعملي في React Props
    color: '#3b82f6', // لون أزرق مثلاً
    variant: 'square', // شكل مربع
    pixelSize: 8,
    speed: 0.5
});
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
  authContainer.className = "flex items-center gap-3 justify-end";
      if (token && user) {
    // تحديد الرابط والاسم والأيقونة حسب نوع الحساب
    let navLinkHtml = "";

    if (user.accountType === "company") {
      // للشركة: Dashboard
      authService.logout();
    } else {
      // ✅ تم تصحيح المسار هنا (إضافة مجلد profile)
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
      window.location.href = `/src/pages/public%20jobs/jobs.html?search=${encodeURIComponent(
        query
      )}`;
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

  const logoBtn = document.getElementById("logoBtn");
  if (logoBtn) {
    logoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
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
// 3. Load Featured Jobs (With Saved Status Check)
// ============================================================
async function loadFeaturedJobs() {
  const container = document.getElementById("featured-jobs-container");
  if (!container) return;

  try {
    // 1. جلب الوظائف المميزة
    const response = await jobService.getAllJobs({ limit: 6 }); // أو endpoint الـ featured لو عندك
    let jobs = response.data.jobs || [];

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const savedResponse = await jobService.getSavedJobs();
        const savedJobs = savedResponse.data.jobs || [];
        const savedIds = new Set(savedJobs.map((j) => j._id || j.id));

        jobs = jobs.map((job) => ({
          ...job,
          isSaved: savedIds.has(job._id || job.id),
        }));
      } catch (err) {
        console.warn("Could not sync saved jobs state in home");
      }
    }

    container.innerHTML = "";

    if (jobs.length === 0) {
      container.innerHTML =
        '<p class="col-span-full text-center text-slate-500">No jobs available at the moment.</p>';
      return;
    }

    jobs.forEach((job, index) => {
      container.insertAdjacentHTML("beforeend", createJobCard(job, index + 1));
    });
    const observerOptions = {
      root: null,
      threshold: 0.1, // بمجرد ظهور 10% فقط
      rootMargin: "0px" // شيلنا الـ -100px عشان تظهر فوراً
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        } else {
          // لو عايزها تختفي وتظهر تاني مع السكرول سيب السطر ده
          // لو عايزها تظهر مرة واحدة وتثبت، امسح السطر ده
          entry.target.classList.remove("in-view"); 
        }
      });
    }, observerOptions);

    const cards = container.querySelectorAll('.job-card-scroll');
    cards.forEach(card => observer.observe(card));

  } catch (error) {
    console.error("Jobs Error:", error);
    // في حالة الخطأ، شيل الكلاس عشان المحتوى يظهر وميضعش
    container.querySelectorAll('.job-card-scroll').forEach(el => el.style.opacity = 1);
    container.innerHTML = '<p class="col-span-full text-center text-red-400">Failed to load jobs.</p>';
  }
}

function createJobCard(job, index) {
  const timeAgo = getTimeAgo(job.postedAt || job.createdAt);

  const companyData = job.companyId || job.company || {};

  const companyName =
    companyData.companyName || companyData.name || "Confidential Company";

  let companyLogo = "https://placehold.co/48x48?text=Logo";
  const rawLogo = companyData.logo || companyData.logoUrl;

  if (rawLogo && !rawLogo.includes("url...") && rawLogo.length > 10) {
    companyLogo = rawLogo.startsWith("http")
      ? rawLogo
      : `http://localhost:3000${rawLogo}`;
  }

  const location = job.location || companyData.location || "Remote";

  const companyLinkId = companyData._id || companyData.id;

  // ============================================================

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

  // روابط الانتقال
  const jobLink = `/job-details.html?id=${job.id || job._id}`;
  const companyLink = companyLinkId
    ? `/company-details.html?id=${companyLinkId}`
    : "#";

    const delay = (index % 6) * 100;

  return `
<div class="job-card-scroll bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative group border border-slate-100 flex flex-col h-full text-left"
        style="transition-delay: ${delay}ms;">  

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
                <h3 class="font-medium font-poppins text-slate-900 leading-tight line-clamp-1 hover:text-blue-600 cursor-pointer" onclick="window.location.href='${jobLink}'" title="${
    job.title
  }">
                    ${job.title}
                </h3>
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span class="hover:text-blue-600 cursor-pointer transition-colors" onclick="window.location.href='${companyLink}'">
                        <i class="fa-regular fa-building mr-1"></i> ${companyName}
                    </span>
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
    company.companyDescription ||
    company.description ||
    company.about ||
    "No description available.";
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
                        
                        <a class="text-blue-600 text-sm font-normal mb-4">
                            ${positions} Open Positions
                        </a>
                    </div>
                </div>
                
                <div class="companyCard-back bg-white p-6 rounded-xl shadow-md flex flex-col justify-center text-center border border-slate-200">
                    <h3 class="text-lg font-semibold mb-3 text-slate-800">About Company</h3>
                    <p class="text-sm text-slate-600 leading-relaxed mb-4">
                        ${shortDesc}
                    </p>
                    <button onclick="window.location.href='/src/pages/public companies/companyDetails.html?id=${
                      company.id || company._id
                    }'" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-blue-500/20 shadow-sm">
                        View Jobs
                    </button>
                </div>

            </div>
        </div>
        
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
    const isSaved = icon.classList.contains("fa-solid");

    // Optimistic UI Update (تحديث الواجهة فوراً قبل رد السيرفر)
    if (isSaved) {
      icon.classList.remove("fa-solid", "text-blue-600");
      icon.classList.add("fa-regular", "text-slate-400");
    } else {
      icon.classList.remove("fa-regular", "text-slate-400");
      icon.classList.add("fa-solid", "text-blue-600");
    }

    // استدعاء السيرفر
    await jobService.toggleSaveJob(jobId);

    // (اختياري) يمكنك إظهار Toast notification صغير هنا
    // Toastify({ text: isSaved ? "Removed from saved" : "Job Saved", ... }).showToast();
  } catch (error) {
    console.error("Save Error:", error);
    // التراجع في حالة الخطأ
    const icon = btnElement.querySelector("i");
    // اعكس الحالة مرة أخرى
    // ...
    Swal.fire("Error", "Failed to save job.", "error");
  }
};

window.closeApplyModal = function () {
  const modal = document.getElementById("applyModal");
  if (modal) modal.classList.add("hidden");
  
  const form = document.getElementById("applyForm");
  if (form) form.reset();
};

function initModalEvents() {
  const modal = document.getElementById("applyModal");
  const closeBtn = document.getElementById("btnCloseModal");
  
  // لاحظي: شيلنا تعريف cancelBtn من هنا لأنه هيتغير تحت
  // const cancelBtn = document.getElementById("btnCancelModal"); <-- مش محتاجينه هنا

  let form = document.getElementById("applyForm");

  // --- دالة الإغلاق الموحدة ---
  const close = () => {
    if (modal) modal.classList.add("hidden");
    if (form) form.reset();

    // إعادة تعيين نص الملف
    const fileInput = document.getElementById("applyCv");
    if (fileInput) {
        const dropZone = fileInput.closest('.group');
        const fileNameDisplay = dropZone?.querySelector('p.text-slate-600');
        if (fileNameDisplay) {
             fileNameDisplay.textContent = "SVG, PNG, JPG or GIF (MAX. 800x400px)";
             fileNameDisplay.classList.remove('text-blue-600', 'font-bold');
        }
    }
  };

  if (closeBtn) closeBtn.onclick = close;
  
  // إغلاق عند الضغط خارج المودال
  window.onclick = (e) => {
    if (e.target === modal) close();
  };

  // إغلاق عند الضغط على Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        close();
    }
  });

  if (form) {
    // 1. نسخ الفورم
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    form = newForm; 

    // ✅✅✅ الجزء المضاف لتصليح زرار Cancel ✅✅✅
    // بنجيب الزرار من "الفورم الجديد" ونربطه بدالة القفل
    const newCancelBtn = newForm.querySelector("#btnCancelModal");
    if (newCancelBtn) {
        newCancelBtn.onclick = close; // ربطناه بدالة الإغلاق
        newCancelBtn.type = "button"; // تأكيد إنه مش submit
    }
    // ✅✅✅ نهاية التعديل ✅✅✅

    // كود إظهار اسم الملف
    const fileInput = document.getElementById("applyCv");
    if (fileInput) {
        const dropZone = fileInput.closest('.group');
        const fileNameDisplay = dropZone?.querySelector('p.text-slate-600');

        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0] && fileNameDisplay) {
                fileNameDisplay.textContent = `Selected: ${this.files[0].name}`;
                fileNameDisplay.classList.add('text-blue-600', 'font-bold');
            }
        });
    }

    // تعريف زر الإرسال الجديد
    const newSubmitBtn = newForm.querySelector('button[type="submit"]');

    // Submit Logic
    newForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const jobId = modal.dataset.jobId;
      const currentFileInput = document.getElementById("applyCv");

      if (!currentFileInput.files || currentFileInput.files.length === 0) {
        Swal.fire("Warning", "Please upload your CV.", "warning");
        return;
      }

      const applyData = {
        fullName: document.getElementById("applyName").value,
        email: document.getElementById("applyEmail").value,
        phone: document.getElementById("applyPhone").value,
        cvFile: currentFileInput.files[0],
        coverLetter: document.getElementById("applyCover").value,
      };

      try {
        if (newSubmitBtn) {
          newSubmitBtn.disabled = true;
          newSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }

        await jobService.applyForJob(jobId, applyData);

        Swal.fire("Success", "Application submitted successfully!", "success");
        close();
      } catch (error) {
        let msg = "Failed to submit application.";
        if (error.response?.status === 409)
          msg = "You have already applied for this job.";
        else if (error.response?.data?.message)
          msg = error.response.data.message;

        Swal.fire("Error", msg, "error");
      } finally {
        if (newSubmitBtn) {
          newSubmitBtn.disabled = false;
          newSubmitBtn.innerHTML = "Submit Application";
        }
      }
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
  document.body.classList.add("loaded");

  initAuthButtons();
  initNavbarScrolling();
  initScrollSpy();
  initSearch();

  loadFeaturedJobs();
  loadTopCompanies();

  initModalEvents();
});

window.addEventListener("load", function () {
  document.body.classList.add("loaded");
});
document.addEventListener("click", function (e) {
  const profileBtn = e.target.closest("#profileBtn");
  if (profileBtn) {
    e.preventDefault();
    const targetUrl = profileBtn.getAttribute("href");
    document.body.classList.remove("loaded");
    setTimeout(function () {
      window.location.href = targetUrl;
    }, 350);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const backToTopBtn = document.getElementById("backToTopBtn");

  if (backToTopBtn) {
    // 1. التحكم في الظهور عند السكرول
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add("show");
      } else {
        backToTopBtn.classList.remove("show");
      }
    });

    // 2. عند الضغط يطلع لفوق
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});

const allButtons = document.querySelectorAll(".transition-link");

allButtons.forEach((btn) => {
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    document.body.classList.remove("loaded");

    const targetUrl = this.href;

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 350);
  });
});
