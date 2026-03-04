import { aiFeaturesService } from '../services/aiFeaturesService.js';
import Swal from 'sweetalert2';
import Toastify from 'toastify-js';
import { authService } from '../services/authService.js';

document.addEventListener('DOMContentLoaded', () => {
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

// State Variables (اللوجيك الجديد)
let allQuestions = [];
let userAnswers = Array(30).fill(null); // مصفوفة من 30 مكان فاضي
let currentPage = 0;
const questionsPerPage = 6;
const totalPages = 5;

// Initialization
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
});

// Start Quiz Logic
window.goToQuiz = async () => {
  try {
    Toastify({
      text: 'Loading AI Assessment...',
      gravity: 'bottom',
      position: 'right',
      backgroundColor: '#4361ee',
    }).showToast();

    // 1. جلب الـ 30 سؤال من الباك إند
    const res = await aiFeaturesService.getPersonalityQuestions();
    allQuestions = res.data.questions;

    // 2. إظهار شاشة الاختبار
    startView.classList.add('opacity-0');
    setTimeout(() => {
      startView.classList.add('hidden');
      quizView.classList.remove('hidden');
      setTimeout(() => quizView.classList.add('opacity-100'), 50);
      renderPage();
    }, 500);
  } catch (error) {
    console.error(error);
    Swal.fire(
      'Error',
      'Could not load questions. Check your connection.',
      'error'
    );
  }
};

// 💡 دالة رسم 6 أسئلة في الصفحة الواحدة
function renderPage() {
  qCounter.innerText = `Section ${currentPage + 1} of ${totalPages}`;
  qText.innerText =
    "Please answer honestly, even if you don't like the answer.";

  // حساب النسبة المئوية لشريط التقدم
  progressBar.style.width = `${(currentPage / totalPages) * 100}%`;

  // استقطاع 6 أسئلة للصفحة الحالية
  const startIndex = currentPage * questionsPerPage;
  const currentQuestions = allQuestions.slice(
    startIndex,
    startIndex + questionsPerPage
  );

  optionsBox.innerHTML = currentQuestions
    .map((qText, index) => {
      const globalIndex = startIndex + index;
      return `
            <div class="mb-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                <h4 class="text-lg md:text-xl font-semibold text-dark mb-8 text-center">${globalIndex + 1}. ${qText}</h4>
                <div class="scale-group">
                    <label class="scale-option disagree" title="Strongly Disagree">
                        <input type="radio" name="q${globalIndex}" value="1" onchange="handleAnswer(${globalIndex}, 1)">
                        <div class="circle size-lg"></div>
                        <span class="text-[10px] font-bold text-slate-400 mt-3 text-center uppercase tracking-wider hidden md:block">Strongly<br>Disagree</span>
                    </label>
                    
                    <label class="scale-option disagree" title="Disagree">
                        <input type="radio" name="q${globalIndex}" value="2" onchange="handleAnswer(${globalIndex}, 2)">
                        <div class="circle size-md"></div>
                    </label>
                    
                    <label class="scale-option disagree" title="Slightly Disagree">
                        <input type="radio" name="q${globalIndex}" value="3" onchange="handleAnswer(${globalIndex}, 3)">
                        <div class="circle size-sm"></div>
                    </label>
                    
                    <label class="scale-option neutral" title="Neutral">
                        <input type="radio" name="q${globalIndex}" value="4" onchange="handleAnswer(${globalIndex}, 4)">
                        <div class="circle size-sm"></div>
                        <span class="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-wider hidden md:block">Neutral</span>
                    </label>
                    
                    <label class="scale-option agree" title="Slightly Agree">
                        <input type="radio" name="q${globalIndex}" value="5" onchange="handleAnswer(${globalIndex}, 5)">
                        <div class="circle size-sm"></div>
                    </label>
                    
                    <label class="scale-option agree" title="Agree">
                        <input type="radio" name="q${globalIndex}" value="6" onchange="handleAnswer(${globalIndex}, 6)">
                        <div class="circle size-md"></div>
                    </label>
                    
                    <label class="scale-option agree" title="Strongly Agree">
                        <input type="radio" name="q${globalIndex}" value="7" onchange="handleAnswer(${globalIndex}, 7)">
                        <div class="circle size-lg"></div>
                        <span class="text-[10px] font-bold text-slate-400 mt-3 text-center uppercase tracking-wider hidden md:block">Strongly<br>Agree</span>
                    </label>
                </div>
            </div>
        `;
    })
    .join('');

  checkPageCompletion();
}

// 💡 تسجيل إجابة المستخدم وفحص ما إذا كان قد أتم الـ 6 أسئلة
window.handleAnswer = (globalIndex, value) => {
  userAnswers[globalIndex] = value;
  checkPageCompletion();
};

function checkPageCompletion() {
  const startIndex = currentPage * questionsPerPage;
  const pageAnswers = userAnswers.slice(
    startIndex,
    startIndex + questionsPerPage
  );

  // لو كل الـ 6 أسئلة متجاوبين، شغل زرار Next
  const isPageComplete = pageAnswers.every((ans) => ans !== null);

  if (isPageComplete) {
    nextBtn.classList.remove('opacity-50', 'pointer-events-none');
    if (currentPage === totalPages - 1) {
      nextBtn.innerText = 'Submit Results';
      nextBtn.classList.replace('bg-blue-500', 'bg-green-500');
      nextBtn.classList.replace('hover:bg-blue-600', 'hover:bg-green-600');
    }
  } else {
    nextBtn.classList.add('opacity-50', 'pointer-events-none');
  }
}

// 💡 الانتقال للصفحة التالية أو الإرسال
window.nextQuestion = () => {
  if (currentPage < totalPages - 1) {
    currentPage++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderPage();
  } else {
    submitTest();
  }
};

// 💡 إرسال المصفوفة للباك إند
async function submitTest() {
  try {
    progressBar.style.width = `100%`; // اكتمال الشريط
    Swal.fire({
      title: 'Analyzing your profile...',
      html: 'Our AI is generating your perfect career match.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await aiFeaturesService.submitPersonalityTest(userAnswers);

    Swal.close();
    renderResults(res.data);
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'Analysis failed. Please try again.', 'error');
  }
}

// 💡 رسم كارت النتيجة ليطابق تصميم الإسكرين شوت
function renderResults(data) {
  quizView.classList.add('hidden');
  resultView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // فصل كود الشخصية عن اسمها (e.g., "ISFP: The Adventurer" -> "ISFP", "The Adventurer")
  const [code, title] = data.personalityType.split(': ');

  // حقن العنوان
  document.getElementById('result-title').innerHTML = `
        <span class="text-dark">${title}</span> 
        <span class="text-primary">(${code})</span>
    `;

  // حقن الملخص
  document.getElementById('result-summary').innerText = data.summary;

  // حقن الوظائف الـ 4 المقترحة
  document.getElementById('careers-container').innerHTML = data.suggestedCareers
    .map(
      (career) => `
        <div class="p-6 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-md transition">
            <h4 class="text-lg font-bold text-dark mb-2">${career.title}</h4>
            <p class="text-sm text-slate-500 font-medium leading-relaxed">${career.reason}</p>
        </div>
    `
    )
    .join('');
}

// ==========================================
// Auth Buttons Logic (كودك الأصلي كما هو)
// ==========================================
function initAuthButtons() {
  const authContainer = document.getElementById('auth-buttons-container');
  if (!authContainer) return;
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  authContainer.className = 'flex items-center gap-3 justify-end';

  if (token && user) {
    let navLinkHtml = '';

    if (user.accountType === 'company') {
      authService.logout();
    } else {
      navLinkHtml = `
            <a id="profileBtn" href="/profile" class="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-2 transition duration-300 whitespace-nowrap">
              <i class="fas fa-user-circle text-lg"></i> Profile
          </a>`;
    }

    authContainer.innerHTML = `
          ${navLinkHtml}
          <div class="min-w-[150px] flex justify-end">
              <button id="btnLogout" class="group flex items-center justify-start w-11 h-11 bg-red-600 rounded-full cursor-pointer relative overflow-hidden transition-all duration-500 shadow-lg hover:w-32 hover:rounded-3xl active:translate-x-1 active:translate-y-1">
                  <div class="flex items-center justify-center w-full transition-all duration-300 group-hover:justify-start group-hover:px-3">
                      <svg class="w-4 h-4" viewBox="0 0 512 512" fill="white">
                          <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
                      </svg>
                  </div>
                  <div class="absolute right-5 transform translate-x-full opacity-0 text-white text-lg font-semibold transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                      Logout
                  </div>
              </button>
          </div>
      `;

    document.getElementById('btnLogout').addEventListener('click', () => {
      authService.logout();
    });
  } else {
    authContainer.innerHTML = `
          <a href="/login" class="text-sm font-medium text-slate-600 hover:text-blue-600">Login</a>
          <a href="/signup?mode=signup" class="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition shadow-md shadow-blue-500/30">Sign Up</a>
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
