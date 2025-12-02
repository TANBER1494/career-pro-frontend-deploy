import SeekerService from '../services/seekerService.js';

// 1. Auth Guard
// نحن الآن داخل (src/pages/seeker/seeker steps/)
// للخروج لـ (login.html) نحتاج للخروج خطوتين: (seeker steps) -> (seeker) -> (pages) -> (auth)
const token = localStorage.getItem('authToken');
if (!token) window.location.href = '../../pages/auth/signup-login.html';

// ===================================================
// Helper: Cities Data & Logic (UI Only)
// ===================================================
const citiesData = {
    "Egypt": ["Cairo", "Giza", "Alexandria", "Mansoura", "Luxor", "Aswan", "Asyut", "Port Said", "Suez", "Tanta"],
    "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Abha", "Tabuk", "Hail"],
    "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
    "Jordan": ["Amman", "Zarqa", "Irbid", "Aqaba", "Madaba", "Jerash"],
    "Lebanon": ["Beirut", "Tripoli", "Sidon", "Tyre", "Baalbek", "Zahle"],
    "Iraq": ["Baghdad", "Basra", "Mosul", "Erbil", "Kirkuk", "Najaf", "Karbala"],
    "Syria": ["Damascus", "Aleppo", "Homs", "Hama", "Latakia", "Tartus"],
    "Kuwait": ["Kuwait City", "Al Ahmadi", "Hawalli", "Al Farwaniyah", "Al Jahra"],
    "Oman": ["Muscat", "Salalah", "Sohar", "Nizwa", "Sur", "Buraimi"],
    "Qatar": ["Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Umm Salal"],
    "Bahrain": ["Manama", "Riffa", "Muharraq", "Hamad Town", "Isa Town"],
    "Yemen": ["Sana'a", "Aden", "Taiz", "Al Hudaydah", "Ibb"],
    "Palestine": ["Jerusalem", "Gaza City", "Ramallah", "Nablus", "Hebron", "Bethlehem", "Jenin", "Jericho"],
    "Libya": ["Tripoli", "Benghazi", "Misrata", "Tobruk", "Sebha"],
    "Tunisia": ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabes"],
    "Algeria": ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna"],
    "Morocco": ["Casablanca", "Rabat", "Fes", "Marrakech", "Tangier", "Agadir", "Meknes"],
    "Sudan": ["Khartoum", "Omdurman", "Port Sudan", "Nyala", "Kassala"],
    "Mauritania": ["Nouakchott", "Nouadhibou", "Kiffa", "Rosso"],
    "Somalia": ["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Berbera"],
    "Djibouti": ["Djibouti City", "Ali Sabieh", "Tadjoura"],
    "Comoros": ["Moroni", "Mutsamudu", "Fomboni"]
};

const countrySelect = document.getElementById('country');
const citySelect = document.getElementById('city');

if (countrySelect && citySelect) {
    countrySelect.addEventListener('change', function() {
        const selectedCountry = this.value;
        const cities = citiesData[selectedCountry] || []; 

        citySelect.innerHTML = '<option value="" disabled selected>Select City</option>';
        citySelect.disabled = false;

        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    });
}

// ===================================================
// Step 1 Controller
// ===================================================
const step1Form = document.getElementById('step1Form');
if (step1Form) {
    step1Form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = step1Form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = 'Saving...';
        btn.disabled = true;

        const profileData = {
            phoneNumber: document.getElementById('phoneNumber').value,
            birthDate: document.getElementById('birthDate').value,
            gender: document.getElementById('gender').value,
            experienceLevel: document.getElementById('experienceLevel').value,
            yearsOfExperience: parseInt(document.getElementById('yearsOfExperience').value),
            industry: document.getElementById('industry').value,
            country: document.getElementById('country').value,
            city: document.getElementById('city').value
        };

        try {
            await SeekerService.updatePersonalInfo(profileData);
            
            // تحديث اللوكال ستوريج
            const userData = JSON.parse(localStorage.getItem('user')) || {};
            localStorage.setItem('user', JSON.stringify({ ...userData, ...profileData }));

            alert('Personal Info Saved!');

            window.location.href = '../../pages/seeker/seeker steps/ProfileStep2.html';

        } catch (error) {
            console.error(error);
            alert(error.message || 'Failed to update profile');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    document.getElementById('backBtn')?.addEventListener('click', () => {

        window.location.href = '../../pages/auth/signup-login.html'; 
    });
}

// ===================================================
// Step 2 Controller
// ===================================================
const step2Form = document.getElementById('step2Form');
if (step2Form) {
    step2Form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = step2Form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = 'Saving...';
        btn.disabled = true;

        const eduData = {
            degree: document.getElementById('degree').value,
            university: document.getElementById('university').value,
            graduationYear: parseInt(document.getElementById('graduationYear').value),
            gpa: document.getElementById('gpa').value ? parseFloat(document.getElementById('gpa').value) : null,
            jobType: document.getElementById('jobType').value,
            workplaceSetting: document.getElementById('workplaceSetting').value
        };

        try {
            await SeekerService.updateEducation(eduData);

            const userData = JSON.parse(localStorage.getItem('user')) || {};
            localStorage.setItem('user', JSON.stringify({ ...userData, ...eduData }));

            alert('Education Details Saved!');
            // الانتقال لـ Step 3 (في نفس الفولدر)
            window.location.href = '../../pages/seeker/seeker steps/ProfileStep3.html';

        } catch (error) {
            console.error(error);
            alert(error.message || 'Failed to save data');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.location.href = '../../pages/seeker/seeker steps/ProfileStep1.html';
    });
}

// ===================================================
// Step 3 Controller (Upload CV)
// ===================================================
const step3Form = document.getElementById('step3Form');
if (step3Form) {
    const fileInput = document.getElementById('cvFile');
    const finishBtn = document.getElementById('finishBtn');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    // تحديث اسم الملف عند الاختيار
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameDisplay.textContent = fileInput.files[0].name;
            fileNameDisplay.classList.add('text-green-600', 'font-bold');
        } else {
            fileNameDisplay.textContent = "No file chosen";
            fileNameDisplay.classList.remove('text-green-600', 'font-bold');
        }
    });

    step3Form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a file first!');
            return;
        }

        const originalText = finishBtn.innerText;
        finishBtn.innerText = 'Uploading...';
        finishBtn.disabled = true;

        try {
            const response = await SeekerService.uploadCV(file);
            
            const userData = JSON.parse(localStorage.getItem('user')) || {};
            if (response.data && response.data.cvUrl) {
                userData.cvUrl = response.data.cvUrl;
            }
            userData.registrationStep = 3;
            localStorage.setItem('user', JSON.stringify(userData));

            alert('Account created Successfully! 🎉');
            
            // الانتقال للبروفايل: (نخرج من seeker steps -> ندخل profile -> profile.html)
            window.location.href = '../../pages/seeker/profile/profile.html'; 

        } catch (error) {
            console.error(error);
            alert(error.message || 'Upload failed');
            finishBtn.innerText = originalText;
            finishBtn.disabled = false;
        }
    });

    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.location.href = '../../pages/seeker/seeker steps/ProfileStep2.html';
    });
}