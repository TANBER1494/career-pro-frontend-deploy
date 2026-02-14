import { aiFeaturesService } from "../services/aiFeaturesService.js";
import Swal from "sweetalert2";
import Toastify from "toastify-js";
import { authService } from "../services/authService.js";
document.addEventListener("DOMContentLoaded", () => {
  initAuthButtons();
});
// DOM Elements
const startView = document.getElementById('start-view');
const quizView = document.getElementById('quiz-view');
const resultView = document.getElementById('result-view');
const optionsBox = document.getElementById('options-box');
const qText = document.getElementById('q-text');
const qCounter = document.getElementById('q-counter');
const progressBar = document.getElementById('progress-bar');
const nextBtn = document.getElementById('next-btn');

// State
let allQuestions = [];
let currentIdx = 0;
let userAnswers = [];
let selectedAnswerForQ = null;

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
});

// Start Quiz Logic
window.goToQuiz = async () => {
    try {
        Toastify({
            text: "Loading AI Assessment...",
            gravity: "bottom",
            position: "right",
            backgroundColor: "#4361ee",
        }).showToast();

        // مناداة الفانكشن من السيرفس اللي محمد مجهزها
        const res = await aiFeaturesService.getPersonalityQuestions();
        allQuestions = res.data;

        startView.classList.add('opacity-0');
        setTimeout(() => {
            startView.classList.add('hidden');
            quizView.classList.remove('hidden');
            setTimeout(() => quizView.classList.add('opacity-100'), 50);
            renderQuestion();
        }, 500);
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Could not load questions. Check your connection.", "error");
    }
};

function renderQuestion() {
    const q = allQuestions[currentIdx];
    qCounter.innerText = `Question ${currentIdx + 1} of ${allQuestions.length}`;
    qText.innerText = q.text;
    progressBar.style.width = `${(currentIdx / allQuestions.length) * 100}%`;
    
    optionsBox.innerHTML = q.options.map(opt => `
        <div onclick="handleSelectOption(this, '${opt}')" 
             class="w-full bg-white border-2 border-slate-200 p-5 rounded-lg cursor-pointer flex items-center gap-4 transition hover:bg-slate-50 group option-card">
            <div class="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0 group-hover:border-primary">
                <div class="selection-dot w-2.5 h-2.5 bg-primary rounded-full hidden"></div>
            </div> 
            <span class="text-slate-700 font-medium">${opt}</span>
        </div>
    `).join("");

    nextBtn.classList.add('opacity-50', 'pointer-events-none');
}

window.handleSelectOption = (el, val) => {
    document.querySelectorAll('.option-card').forEach(c => {
        c.classList.remove('border-primary', 'bg-blue-50');
        c.querySelector('.selection-dot').classList.add('hidden');
    });
    el.classList.add('border-primary', 'bg-blue-50');
    el.querySelector('.selection-dot').classList.remove('hidden');
    selectedAnswerForQ = val;
    nextBtn.classList.remove('opacity-50', 'pointer-events-none');
};

window.nextQuestion = () => {
    userAnswers.push({ id: allQuestions[currentIdx].id, answer: selectedAnswerForQ });
    if (currentIdx < allQuestions.length - 1) {
        currentIdx++;
        renderQuestion();
    } else {
        submitTest();
    }
};

async function submitTest() {
    try {
        Swal.fire({ 
            title: 'Analyzing your profile...', 
            allowOutsideClick: false, 
            didOpen: () => Swal.showLoading() 
        });

        const res = await aiFeaturesService.submitPersonalityAnswers(userAnswers);
        
        Swal.close();
        renderResults(res.data);
    } catch (error) {
        Swal.fire("Error", "Analysis failed. Please try again.", "error");
    }
}

function renderResults(data) {
    quizView.classList.add('hidden');
    resultView.classList.remove('hidden');
    
    document.getElementById('skills-container').innerHTML = data.skills.map(s => `
        <div>
            <div class="flex justify-between items-end mb-2">
                <span class="text-sm font-bold text-dark">${s.name}</span>
                <span class="bg-primary text-white text-[10px] px-2 py-0.5 rounded font-bold">${s.score}%</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                <div class="bg-slate-900 h-1.5 rounded-full transition-all duration-1000" style="width: ${s.score}%"></div>
            </div>
        </div>
    `).join("");

    document.getElementById('careers-container').innerHTML = data.careers.map(c => `
        <div class="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
            <span class="font-medium text-dark text-sm">${c}</span>
            <i class="fa-solid fa-suitcase text-primary"></i>
        </div>
    `).join("");
}
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