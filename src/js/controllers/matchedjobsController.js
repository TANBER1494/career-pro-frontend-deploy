import { authService } from "../services/authService.js";
document.addEventListener("DOMContentLoaded", () => {
  initAuthButtons();
});
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
document.addEventListener('DOMContentLoaded', function () {
  // 1. تعريف العناصر (Variables)
  const modal = document.getElementById('applyModal');
  const openBtn = document.getElementById('apply'); // الزرار اللي هيفتح المودال
  const closeBtn = document.getElementById('btnCloseModal'); // زرار الـ X
  const cancelBtn = document.getElementById('btnCancelModal'); // زرار Cancel
  
  // دالة لفتح المودال
  const openModal = () => {
      modal.classList.remove('hidden');
      // بنضيف انيميشن بسيط للظهور
      setTimeout(() => {
          modal.classList.remove('opacity-0');
          modal.querySelector('div').classList.remove('scale-95');
          modal.querySelector('div').classList.add('scale-100');
      }, 10);
  };

  // دالة لقفل المودال
  const closeModal = () => {
      // نرجع الانيميشن للاختفاء الأول
      modal.classList.add('opacity-0');
      modal.querySelector('div').classList.remove('scale-100');
      modal.querySelector('div').classList.add('scale-95');
      
      // نستنى الانيميشن يخلص (300ms) وبعدين نخفيه خالص
      setTimeout(() => {
          modal.classList.add('hidden');
      }, 300);
  };

  // 2. تشغيل الأحداث (Event Listeners)
  
  // لما ندوس على زرار apply
  if (openBtn) {
      openBtn.addEventListener('click', (e) => {
          e.preventDefault(); // عشان ميعملش refresh لو هو لينك
          openModal();
      });
  }

  // لما ندوس على زرار الإغلاق (X)
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // لما ندوس على زرار Cancel
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // لما ندوس في الفراغ برة المودال يقفل
  modal.addEventListener('click', (e) => {
      if (e.target === modal) {
          closeModal();
      }
  });

  // لما ندوس على زرار Esc في الكيبورد
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) { 
          closeModal();
      }
  });

  // --- (إضافي) كود عشان يظهر اسم الملف لما ترفعيه ---
  const fileInput = document.getElementById('applyCv');
  const dropZone = fileInput.closest('.group');
  const fileNameDisplay = dropZone.querySelector('p.text-slate-600');

  fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
          fileNameDisplay.textContent = `Selected: ${this.files[0].name}`;
          fileNameDisplay.classList.add('text-blue-600', 'font-bold');
      }
  });
});
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