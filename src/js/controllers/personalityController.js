import { aiFeaturesService } from '../services/aiFeaturesService.js';
import Swal from 'sweetalert2';
import { authService } from '../services/authService.js';

// DOM Elements
const startView = document.getElementById('start-view');
const quizView = document.getElementById('quiz-view');
const resultView = document.getElementById('result-view');
const optionsBox = document.getElementById('options-box');
const qText = document.getElementById('q-text');
const qCounter = document.getElementById('q-counter');
const progressBar = document.getElementById('progress-bar');
const nextBtn = document.getElementById('next-btn');

// State Variables
let allQuestions = [];
let userAnswers = Array(30).fill(null);
let currentPage = 0;
const questionsPerPage = 6;
const totalPages = 5;

// 💡 Strict Auth Guard & Initialization (تم توحيد أحداث التحميل هنا منعاً للتكرار)
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.replace('/login'); 
        return; 
    }

    // بناء الأزرار مرة واحدة فقط بعد التأكد من وجود الـ Token
    initAuthButtons(); 
    
    try {
        const res = await aiFeaturesService.getExistingResult();
        if (res.data) {
            renderResults(res.data);
        } else {
            startView.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error checking existing result:", error);
        startView.classList.remove('hidden'); 
    } finally {
        document.body.classList.add('loaded');
    }
});

// 💡 Start Quiz Logic
window.goToQuiz = async () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  try {
    Swal.fire({
      title: 'Loading Assessment...',
      allowOutsideClick: false,
      background: isDarkMode ? '#0c0a1d' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      didOpen: () => Swal.showLoading(),
    });

    const res = await aiFeaturesService.getPersonalityQuestions();
    allQuestions = res.data.questions;

    Swal.close();

    startView.classList.add('opacity-0');
    setTimeout(() => {
      startView.classList.add('hidden');
      quizView.classList.remove('hidden');
      setTimeout(() => quizView.classList.add('opacity-100'), 50);
      renderPage();
    }, 300);
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Could not load questions. Check your connection.',
      background: isDarkMode ? '#0c0a1d' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      confirmButtonColor: '#3b82f6', 
      iconColor: isDarkMode ? '#f87171' : '#ef4444'
    });
  }
};

// 💡 Retake Test
window.retakeTest = () => {
  userAnswers = Array(30).fill(null);
  currentPage = 0;
  resultView.classList.add('hidden');
  goToQuiz();
};

// 💡 Render Page Questions
function renderPage() {
  qCounter.innerText = `Section ${currentPage + 1} of ${totalPages}`;
  qText.innerText = "Please answer honestly, even if you don't like the answer.";
  progressBar.style.width = `${(currentPage / totalPages) * 100}%`;

  const startIndex = currentPage * questionsPerPage;
  const currentQuestions = allQuestions.slice(startIndex, startIndex + questionsPerPage);

  const labelsText = [
    '<span class="long-text">Strongly </span>Disagree',
    'Disagree',
    '<span class="long-text">Slightly </span>Disagree',
    'Neutral',
    '<span class="long-text">Slightly </span>Agree',
    'Agree',
    '<span class="long-text">Strongly </span>Agree',
  ];

  const sizes = ['lg', 'md', 'sm', 'sm', 'sm', 'md', 'lg'];

  optionsBox.innerHTML = currentQuestions
    .map((qText, index) => {
      const globalIndex = startIndex + index;
      const scaleOptionsHtml = labelsText
        .map((labelText, optIdx) => {
          const value = optIdx + 1;
          const isChecked = userAnswers[globalIndex] === value ? 'checked' : '';
          const cleanTitle = labelText.replace('<span class="long-text">', '').replace('</span>', '');

          return `
                <label class="scale-option opt-${value}" title="${cleanTitle}">
                    <input type="radio" 
                           name="q${globalIndex}" 
                           value="${value}" 
                           ${isChecked} 
                           onchange="handleAnswer(${globalIndex}, ${value})">
                    <div class="circle size-${sizes[optIdx]}"></div>
                    <span class="scale-label">${labelText}</span>
                </label>
            `;
        })
        .join('');

      return `
            <div class="mb-8 p-6 bg-white dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md">
                <h4 class="text-lg md:text-xl font-semibold text-dark mb-10 text-center">${globalIndex + 1}. ${qText}</h4>
                <div class="scale-group">
                    ${scaleOptionsHtml}
                </div>
            </div>
        `;
    })
    .join('');

  checkPageCompletion();
}

window.handleAnswer = (globalIndex, value) => {
  userAnswers[globalIndex] = value;
  checkPageCompletion();
};

function checkPageCompletion() {
  const startIndex = currentPage * questionsPerPage;
  const pageAnswers = userAnswers.slice(startIndex, startIndex + questionsPerPage);
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

window.nextQuestion = () => {
  if (currentPage < totalPages - 1) {
    currentPage++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderPage();
  } else {
    submitTest();
  }
};

async function submitTest() {
  try {
    progressBar.style.width = `100%`;
    const isDarkMode = document.documentElement.classList.contains('dark');
    Swal.fire({
      title: 'Analyzing your profile...',
      html: 'Our AI is generating your perfect career match.',
      allowOutsideClick: false,
      background: isDarkMode ? '#0c0a1d' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      didOpen: () => Swal.showLoading(),
    });

    const res = await aiFeaturesService.submitPersonalityTest(userAnswers);
    Swal.close();
    renderResults(res.data);
  } catch (error) {
    console.error(error);
    const isDarkMode = document.documentElement.classList.contains('dark');
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Analysis failed. Please try again.',
      background: isDarkMode ? '#0c0a1d' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
    });
  }
}

function renderResults(data) {
  quizView.classList.add('hidden');
  resultView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const [code, title] = data.personalityType.split(': ');

  document.getElementById('result-title').innerHTML = `
        <span class="text-dark dark:text-slate-200">${title}</span> 
        <span class="text-primary dark:text-slate-300">(${code})</span>
    `;

  document.getElementById('result-summary').innerText = data.summary;

  document.getElementById('careers-container').innerHTML = data.suggestedCareers
    .map(
      (career) => `
        <div class="p-6 bg-slate-50 dark:bg-black/30 border border-slate-100 dark:border-gray-800 rounded-xl hover:shadow-md transition">
            <h4 class="text-lg font-bold text-dark dark:text-slate-200 mb-2">${career.title}</h4>
            <p class="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">${career.reason}</p>
        </div>
    `
    )
    .join('');
}

// ==========================================
// Auth Buttons Logic (تم الإصلاح والهيكلة وتعديل الأبعاد)
// ==========================================
function initAuthButtons() {
  const authContainer = document.getElementById('auth-buttons-container');
  if (!authContainer) return;
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  // 💡 إضافة كلاسات عرض الـ Flex بشكل صحيح ومسافة مريحة للأزرار جنباً إلى جنب
  authContainer.className = 'flex items-center gap-4 justify-end w-auto min-w-max';
  
  if (token && user) {
    let navLinkHtml = '';

    if (user.accountType === 'company') {
      authService.logout();
    } else {
      navLinkHtml = `
          <a id="profileBtn" href="/profile" class="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 transition duration-300 whitespace-nowrap">
            <i class="fas fa-user-circle text-2xl"></i>
            <span class="hidden md:inline">Profile</span>
          </a>`;
    }

    // 💡 تم تبديل الترتيب هنا: الـ Logout أولاً ثم الـ Profile
    authContainer.innerHTML = `

    ${navLinkHtml}
    <div class="flex items-center">
        <button 
  id="btnLogout"
  class="flex items-center justify-center mr-4 w-8 h-8 bg-red-600 rounded-full cursor-pointer shadow-lg "
>
  <svg class="w-4 h-4" viewBox="0 0 512 512" fill="white">
    <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
  </svg>
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

// التعامل مع حدث الضغط على الـ Profile بشكل مرن وديناميكي
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

// BFCache Fix
window.addEventListener('pageshow', function (event) {
    document.body.classList.add('loaded');
});