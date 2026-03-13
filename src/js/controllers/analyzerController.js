import { authService } from "../services/authService.js";
import { aiFeaturesService } from "../services/aiFeaturesService.js";
import Swal from 'sweetalert2';

document.addEventListener("DOMContentLoaded", () => {
  initAuthButtons();
});

// ==========================================
// 1. Elements Selection
// ==========================================

// Sections
const uploadSection = document.getElementById('upload-section');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');

// Upload Elements
const fileInput = document.getElementById('cv-upload');
const uploadZone = document.getElementById('upload-zone');
const filePreview = document.getElementById('file-preview');
const fileNameEl = document.getElementById('file-name');
const fileSizeEl = document.getElementById('file-size');
const removeFileBtn = document.getElementById('remove-file-btn');
const jobDescInput = document.getElementById('job-desc');
const analyzeBtn = document.getElementById('analyze-btn');

// Loading Elements
const loadingProgressBar = document.getElementById('loading-progress-bar');
const loadingPercentage = document.getElementById('loading-percentage');
const loadingCaption = document.getElementById('loading-caption');

// Results Elements
const backToUploadBtn = document.getElementById('back-to-upload');
const analyzeAnotherBtn = document.getElementById('analyze-another-btn');

// State Variables
let selectedFile = null;
let progressInterval = null;
let captionInterval = null;

// ==========================================
// 2. Logic: Upload View & Validation
// ==========================================

fileInput.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        
        // التحقق من الحجم (الحد الأقصى 5 ميجا)
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire('Error', 'File size exceeds 5MB limit.', 'error');
            this.value = '';
            return;
        }

        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        
        uploadZone.classList.add('hidden');
        filePreview.classList.remove('hidden');
        
        validateForm();
    }
});

removeFileBtn.addEventListener('click', function() {
    fileInput.value = ''; 
    selectedFile = null;
    uploadZone.classList.remove('hidden');
    filePreview.classList.add('hidden');
    validateForm();
});

jobDescInput.addEventListener('input', validateForm);

function validateForm() {
    const isTextEntered = jobDescInput.value.trim().length > 0;
    analyzeBtn.disabled = !(selectedFile && isTextEntered);
}

// ==========================================
// 3. Logic: Smart Loading Engine
// ==========================================

const loadingCaptions = [
    "Reading your document structure...",
    "Extracting skills and experiences...",
    "Analyzing context and job requirements...",
    "Running Natural Language Processing (NLP)...",
    "Calculating ATS compatibility score...",
    "Generating personalized recommendations...",
    "Finalizing report..."
];

function startLoadingAnimation() {
    uploadSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    let progress = 0;
    let captionIndex = 0;
    loadingCaption.textContent = loadingCaptions[0];

    // زيادة الـ Progress Bar بشكل عشوائي للتمويه على مدار 25 ثانية (يصل كحد أقصى لـ 95%)
    progressInterval = setInterval(() => {
        if (progress < 95) {
            const increment = Math.random() * 3 + 1; // رقم عشوائي بين 1 و 4
            progress += increment;
            if (progress > 95) progress = 95;
            
            const rounded = Math.floor(progress);
            loadingProgressBar.style.width = `${rounded}%`;
            loadingPercentage.textContent = `${rounded}%`;
        }
    }, 800);

    // تغيير النصوص كل 3.5 ثواني
    captionInterval = setInterval(() => {
        captionIndex++;
        if (captionIndex < loadingCaptions.length) {
            loadingCaption.style.opacity = 0; // Fade out
            setTimeout(() => {
                loadingCaption.textContent = loadingCaptions[captionIndex];
                loadingCaption.style.opacity = 1; // Fade in
            }, 300);
        }
    }, 3500);
}

function completeLoadingAnimation(callback) {
    clearInterval(progressInterval);
    clearInterval(captionInterval);
    
    loadingProgressBar.style.width = `100%`;
    loadingPercentage.textContent = `100%`;
    loadingCaption.textContent = "Analysis Complete!";
    
    // الانتظار نصف ثانية لتأكيد النجاح ثم عرض النتيجة
    setTimeout(() => {
        loadingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        callback();
    }, 800);
}

function stopLoadingWithError() {
    clearInterval(progressInterval);
    clearInterval(captionInterval);
    loadingSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
}

// ==========================================
// 4. API Communication (The Trigger)
// ==========================================

analyzeBtn.addEventListener('click', async function() {
    if (!selectedFile || !jobDescInput.value.trim()) return;

    startLoadingAnimation();

    try {
        const response = await aiFeaturesService.analyzeCV(selectedFile, jobDescInput.value.trim());
        
        // بمجرد وصول الرد بنجاح، نكمل الأنيميشن ونرسم النتيجة
        completeLoadingAnimation(() => {
            renderResults(response.data.result);
        });

    } catch (error) {
        console.error("Analysis Failed:", error);
        stopLoadingWithError();
        Swal.fire({
            icon: 'error',
            title: 'Analysis Failed',
            text: error.response?.data?.message || 'Our AI is currently busy. Please try again in a few moments.'
        });
    }
});

// ==========================================
// 5. Logic: Render Results (Dynamic Binding)
// ==========================================

function renderResults(data) {
    // 1. معالجة الـ ATS Score
    const scoreStr = data.ats_score.replace('%', '');
    const scoreNum = parseInt(scoreStr);
    
    document.getElementById('ats-score-text').textContent = `${scoreNum}%`;
    const scoreCircle = document.getElementById('ats-score-circle');
    const scoreMsg = document.getElementById('ats-score-message');

    // تلوين ذكي بناءً على النسبة
    scoreCircle.className = "absolute inset-0 rounded-full border-8 transition-all duration-1000"; // Reset classes
    if (scoreNum >= 80) {
        scoreCircle.classList.add('border-green-500');
        scoreMsg.textContent = "Excellent Compatibility!";
        scoreMsg.className = "text-sm font-bold text-green-600 mt-4";
    } else if (scoreNum >= 50) {
        scoreCircle.classList.add('border-yellow-500');
        scoreMsg.textContent = "Good, but needs optimization.";
        scoreMsg.className = "text-sm font-bold text-yellow-600 mt-4";
    } else {
        scoreCircle.classList.add('border-red-500');
        scoreMsg.textContent = "Low Compatibility. Major revisions needed.";
        scoreMsg.className = "text-sm font-bold text-red-600 mt-4";
    }

    // 2. حقن القوائم (نقاط القوة، الضعف، التوصيات)
    renderList('strengths-list', data.strengths, 'bg-green-500');
    renderList('weaknesses-list', data.weaknesses, 'bg-red-500');
    renderList('recommendations-list', data.recommendations, 'bg-yellow-500');

    // 3. حقن الكلمات المفتاحية
    renderKeywords('matched-keywords', 'matched-count', data.keywords_analysis.matched, 'bg-green-100 text-green-700 border-green-200');
    renderKeywords('missing-keywords', 'missing-count', data.keywords_analysis.missing, 'bg-red-100 text-red-700 border-red-200');
    renderKeywords('relevant-keywords', 'relevant-count', data.keywords_analysis.relevant, 'bg-blue-100 text-blue-700 border-blue-200');
}

// دالة مساعدة لرسم القوائم (ul/li)
function renderList(elementId, itemsArray, dotColorClass) {
    const ul = document.getElementById(elementId);
    if (!itemsArray || itemsArray.length === 0) {
        ul.innerHTML = `<li class="text-sm text-slate-400 italic">No data found.</li>`;
        return;
    }
    ul.innerHTML = itemsArray.map(item => `
        <li class="flex items-start gap-2 text-sm text-slate-600 font-medium">
            <span class="w-2 h-2 ${dotColorClass} rounded-full mt-1.5 shrink-0 shadow-sm"></span>
            <span class="leading-relaxed">${item}</span>
        </li>
    `).join('');
}

// دالة مساعدة لرسم الكلمات المفتاحية (Pills/Badges)
function renderKeywords(containerId, countId, itemsArray, styleClasses) {
    document.getElementById(countId).textContent = itemsArray ? itemsArray.length : 0;
    const container = document.getElementById(containerId);
    
    if (!itemsArray || itemsArray.length === 0) {
        container.innerHTML = `<span class="text-xs text-slate-400 italic">None</span>`;
        return;
    }
    container.innerHTML = itemsArray.map(keyword => `
        <span class="${styleClasses} px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-sm">${keyword}</span>
    `).join('');
}

// ==========================================
// 6. Reset Flow (Try Another CV)
// ==========================================

function resetToUpload() {
    resultsSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // إفراغ الداتا لتبدأ من جديد
    removeFileBtn.click();
    jobDescInput.value = '';
    loadingProgressBar.style.width = '0%';
    loadingPercentage.textContent = '0%';
}

backToUploadBtn.addEventListener('click', resetToUpload);
analyzeAnotherBtn.addEventListener('click', resetToUpload);


// ==========================================
// 7. General UI / Nav Logic
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
});

const bbtn = document.getElementById('backBtn');
if (bbtn) {
    bbtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.body.classList.remove('loaded');
        setTimeout(() => {
            window.location.href = this.href;
        }, 400);
    });
}

function initAuthButtons() {
    const authContainer = document.getElementById("auth-buttons-container");
    if (!authContainer) return;
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    authContainer.className = "flex items-center gap-3 justify-end";
    if (token && user) {
        let navLinkHtml = "";
        if (user.accountType === "company") {
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
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
              </svg>
            </div>
            <div class="absolute right-5 transform translate-x-full opacity-0 text-white text-lg font-semibold transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
              Logout
            </div>
          </button>
        </div>
          `;

        document.getElementById("btnLogout").addEventListener("click", () => {
            authService.logout();
        });
    } else {
        authContainer.innerHTML = `
              <a href="/login" class="text-sm font-medium text-slate-600 hover:text-blue-600">Login</a>
              <a href="/signup?mode=signup" class="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition shadow-md shadow-blue-500/30">Sign Up</a>
          `;
    }
}