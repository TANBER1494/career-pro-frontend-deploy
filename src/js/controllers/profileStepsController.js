import { seekerService } from '../services/seekerService.js';
import { companyService } from '../services/companyService.js';
import Swal from 'sweetalert2';

// ============================================================
// Helper: Update LocalStorage Step
// ============================================================
function updateLocalRegistrationStep(stepNumber) {
  const localUser = JSON.parse(localStorage.getItem('user'));
  if (localUser) {
    localUser.registrationStep = stepNumber;
    localStorage.setItem('user', JSON.stringify(localUser));
  }
}

// ============================================================
// 1. Initialization & Router Logic
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  // --- Seeker Pages ---
  if (path.includes('SeekerStep1')) initSeekerStep1();
  else if (path.includes('SeekerStep2')) initSeekerStep2();
  else if (path.includes('SeekerStep3')) initSeekerStep3();
  // --- Company Pages ---
  else if (path.includes('CompanyStep1')) initCompanyStep1();
  else if (path.includes('CompanyStep2')) initCompanyStep2();
  else if (path.includes('CompanyStep3')) initCompanyStep3();
});

// ============================================================
// 2. SWALS 
// ============================================================
function swalDarkConfig(options) {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return Swal.fire({
    background: isDarkMode ? '#1e1b4b' : '#ffffff',
    color: isDarkMode ? '#f8fafc' : '#1e293b',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#64748b',
    ...options,
  });
}

// ============================================================
// SECTION A: JOB SEEKER LOGIC
// ============================================================

async function initSeekerStep1() {
  let savedCountry = '';
  let savedCity = '';

  try {
    const response = await seekerService.getMe();

    const personal = response.data.personal;

    document.getElementById('phoneNumber').value =
      personal.phoneNumber || '';

    document.getElementById('birthDate').value =
      personal.birthDate?.split('T')[0] || '';

    document.getElementById('gender').value =
      personal.gender || '';

    document.getElementById('experienceLevel').value =
      personal.experienceLevel || '';

    document.getElementById('yearsOfExperience').value =
      personal.yearsOfExperience || '';

    document.getElementById('industry').value =
      personal.industry || '';

      savedCountry = personal.country || '';
      savedCity = personal.city || '';

  } catch (err) {
    console.error('GETME ERROR:', err);
  }

  const form = document.getElementById('step1Form');

  // Country/City Logic
  const countrySelect = document.getElementById('country');
  const citySelect = document.getElementById('city');

  if (countrySelect && citySelect) {
    const citiesByCountry = {
      Egypt: [
        'Cairo',
        'Giza',
        'Alexandria',
        'Mansoura',
        'Luxor',
        'Aswan',
        'Asyut',
        'Port Said',
        'Suez',
        'Tanta',
      ],
      'Saudi Arabia': [
        'Riyadh',
        'Jeddah',
        'Mecca',
        'Medina',
        'Dammam',
        'Khobar',
        'Abha',
        'Tabuk',
        'Hail',
      ],
      'United Arab Emirates': [
        'Dubai',
        'Abu Dhabi',
        'Sharjah',
        'Ajman',
        'Ras Al Khaimah',
        'Fujairah',
        'Umm Al Quwain',
      ],
      Jordan: ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Jerash'],
      Lebanon: ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Baalbek', 'Zahle'],
      Iraq: [
        'Baghdad',
        'Basra',
        'Mosul',
        'Erbil',
        'Kirkuk',
        'Najaf',
        'Karbala',
      ],
      Syria: ['Damascus', 'Aleppo', 'Homs', 'Hama', 'Latakia', 'Tartus'],
      Kuwait: [
        'Kuwait City',
        'Al Ahmadi',
        'Hawalli',
        'Al Farwaniyah',
        'Al Jahra',
      ],
      Oman: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Buraimi'],
      Qatar: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal'],
      Bahrain: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town'],
      Yemen: ["Sana'a", 'Aden', 'Taiz', 'Al Hudaydah', 'Ibb'],
      Palestine: [
        'Jerusalem',
        'Gaza City',
        'Ramallah',
        'Nablus',
        'Hebron',
        'Bethlehem',
        'Jenin',
        'Jericho',
      ],
      Libya: ['Tripoli', 'Benghazi', 'Misrata', 'Tobruk', 'Sebha'],
      Tunisia: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabes'],
      Algeria: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna'],
      Morocco: [
        'Casablanca',
        'Rabat',
        'Fes',
        'Marrakech',
        'Tangier',
        'Agadir',
        'Meknes',
      ],
      Sudan: ['Khartoum', 'Omdurman', 'Port Sudan', 'Nyala', 'Kassala'],
      Mauritania: ['Nouakchott', 'Nouadhibou', 'Kiffa', 'Rosso'],
      Somalia: ['Mogadishu', 'Hargeisa', 'Bosaso', 'Kismayo', 'Berbera'],
      Djibouti: ['Djibouti City', 'Ali Sabieh', 'Tadjoura'],
      Comoros: ['Moroni', 'Mutsamudu', 'Fomboni'],
    };

    countrySelect.addEventListener('change', (e) => {
      const country = e.target.value;
      citySelect.disabled = false;
      citySelect.innerHTML = `
  <option 
    value="" 
    disabled 
    selected
    class="bg-white text-gray-700 dark:bg-indigo-950 dark:text-slate-200"
  >
    Select city
  </option>
`;
      citySelect.classList.remove('bg-gray-200', 'cursor-not-allowed');
      citySelect.classList.add('bg-gray-50');

      const cities = citiesByCountry[country] || ['Main City', 'Other'];
      cities.forEach((city) => {
        const option = document.createElement('option');
      
        option.value = city;
        option.textContent = city;
      
        option.className =
          'bg-white text-gray-700 dark:bg-indigo-950 dark:text-slate-200';
      
        citySelect.appendChild(option);
      });
    });
    if (savedCountry) {
      countrySelect.value = savedCountry;
    
      countrySelect.dispatchEvent(new Event('change'));
    
      if (savedCity) {
        citySelect.value = savedCity;
        console.log(savedCity);
        console.log(citySelect.value);
      }
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = {
          phoneNumber: document.getElementById('phoneNumber').value,
          birthDate: document.getElementById('birthDate').value,
          gender: document.getElementById('gender').value,
          experienceLevel: document.getElementById('experienceLevel').value,
          yearsOfExperience: document.getElementById('yearsOfExperience').value,
          industry: document.getElementById('industry').value,
          country: document.getElementById('country').value,
          city: document.getElementById('city').value,
        };

        await seekerService.updateProfileStep1(formData);
        updateLocalRegistrationStep(2);
        window.location.href = 'SeekerStep2';
      } catch (error) {
        console.error(error);
        swalDarkConfig({
          title:'Error',
          text:error.response?.data?.message || 'Failed to update profile',
          icon:'error',
      });
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }
}

async function initSeekerStep2() {
  try {
    const response = await seekerService.getMe();

    const education = response.data.education;

    document.getElementById('degree').value =
  education.degree || '';

document.getElementById('university').value =
  education.university || '';

document.getElementById('graduationYear').value =
  education.graduationYear || '';

document.getElementById('jobType').value =
  education.jobType || '';

document.getElementById('workplaceSetting').value =
  education.workplaceSetting || '';

  } catch (err) {
    console.error('GETME ERROR:', err);
  }

  const form = document.getElementById('step2Form');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = {
          degree: document.getElementById('degree').value,
          university: document.getElementById('university').value,
          graduationYear: document.getElementById('graduationYear').value,
          gpa: document.getElementById('gpa')
            ? document.getElementById('gpa').value
            : undefined,
          jobType: document.getElementById('jobType').value,
          workplaceSetting: document.getElementById('workplaceSetting').value,
        };

        await seekerService.updateProfileStep2(formData);
        updateLocalRegistrationStep(3);
        window.location.href = 'SeekerStep3';
      } catch (error) {
        console.error(error);
        swalDarkConfig({
          title:'Error',
          text:error.response?.data?.message || 'Update failed',
          icon:'error'
      });
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
    document.getElementById('backBtn')?.addEventListener('click', () => {
      window.location.href = '/SeekerStep1';
    });
  }
}

function initSeekerStep3() {
  const form = document.getElementById('step3Form');
  const fileInput = document.getElementById('cvFile');
  const fileNameDisplay = document.getElementById('fileName');

  // File Name Display Logic
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        fileNameDisplay.textContent = e.target.files[0].name;
        fileNameDisplay.classList.remove('hidden');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!fileInput.files[0]) {
        swalDarkConfig({title:'Warning', text:'Please upload your CV.',icon:'warning'});
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        await seekerService.uploadCV(fileInput.files[0]);
        updateLocalRegistrationStep(4);

        swalDarkConfig({
          icon: 'success',
          title: 'Profile Completed!',
          text: 'Redirecting to dashboard...',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = '/profile';
        });
      } catch (error) {
        console.error(error);
        swalDarkConfig({
          title:'Error',
          text:error.response?.data?.message || 'Upload failed',
          icon:'error'
      });
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
    document.getElementById('backBtn')?.addEventListener('click', () => {
      window.location.href = '/SeekerStep2';
    });
  }
}

// ============================================================
// SECTION B: COMPANY LOGIC
// ============================================================

async function initCompanyStep1() {
  try {
    const response = await companyService.getProfile();

    const companyInfo = response.data.companyInfo;

    document.getElementById('location').value =
      companyInfo.location || '';

    document.getElementById('industry').value =
      companyInfo.industry || '';

    document.getElementById('foundedYear').value =
      companyInfo.foundedYear || '';

    document.getElementById('numberOfEmployees').value =
      companyInfo.companySize || '';

    document.getElementById('phone').value =
      companyInfo.phone || '';

    document.getElementById('website').value =
      companyInfo.website || '';

    document.getElementById('companyDescription').value =
      companyInfo.companyDescription || '';

  } catch (err) {
    console.error(err);
  }

  const form = document.getElementById('companyStep1Form');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = {
          location: document.getElementById('location').value,
          industry: document.getElementById('industry').value,
          foundedYear: document.getElementById('foundedYear').value,
          numberOfEmployees: document.getElementById('numberOfEmployees').value,
          phone: document.getElementById('phone').value,
          website: document.getElementById('website').value,
          companyDescription:
            document.getElementById('companyDescription').value,
        };

        await companyService.updateProfileStep1(formData);
        updateLocalRegistrationStep(2);
        window.location.href = '/CompanyStep2';
      } catch (error) {
        console.error(error);
        swalDarkConfig({
          title:'Error',
          text:error.response?.data?.message || 'Update failed',
          icon:'error'
      });
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }
}

async function initCompanyStep2() {
  // Tags Management Logic
  const technologies = [];
  const benefits = [];
  try {
    const response = await companyService.getProfile();
  
    const companyDetails = response.data.companyDetails;
  
    document.getElementById('linkedin').value =
      companyDetails.socialMedia?.linkedin || '';
  
    document.getElementById('twitter').value =
      companyDetails.socialMedia?.twitter || '';
  
    document.getElementById('facebook').value =
      companyDetails.socialMedia?.facebook || '';
  
    document.getElementById('instagram').value =
      companyDetails.socialMedia?.instagram || '';
  
    if (companyDetails.technologies) {
      technologies.push(...companyDetails.technologies);
    }
  
    if (companyDetails.benefits) {
      benefits.push(...companyDetails.benefits);
    }
  
  } catch (err) {
    console.error(err);
  }
  const form = document.getElementById('companyStep2Form');


  setupTagsInput(
    'techInput',
    'addTechBtn',
    'techTagsContainer',
    'techCounter',
    technologies,
    3
  );
  setupTagsInput(
    'benefitInput',
    'addBenefitBtn',
    'benefitTagsContainer',
    null,
    benefits,
    0
  );

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validation
      if (technologies.length < 3) {
        swalDarkConfig({title:'Warning', text:'Please add at least 3 technologies.', icon:'warning'});
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = {
          technologies: technologies,
          benefits: benefits,
          linkedin: document.getElementById('linkedin').value,
          twitter: document.getElementById('twitter').value,
          facebook: document.getElementById('facebook').value,
          instagram: document.getElementById('instagram').value,
        };

        await companyService.updateProfileStep2(formData);
        updateLocalRegistrationStep(3);
        window.location.href = '/CompanyStep3';
      } catch (error) {
        console.error(error);
        swalDarkConfig({
          title:'Error',
          text:error.response?.data?.message || 'Update failed',
          icon:'error'
      });
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
    document.getElementById('backBtn')?.addEventListener('click', () => {
      window.location.href = '/CompanyStep1';
    });
  }
}

// Helper for Tags (Tech & Benefits)
function setupTagsInput(
  inputId,
  btnId,
  containerId,
  counterId,
  dataArray,
  minRequired
) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  const container = document.getElementById(containerId);
  const counter = counterId ? document.getElementById(counterId) : null;

  if (!input || !btn || !container) return;

  const addTag = () => {
    const val = input.value.trim();

    const exists = dataArray.some(
      (item) => item.toLowerCase() === val.toLowerCase()
    );

    if (val && !exists) {
      dataArray.push(val);
      renderTags();
      input.value = '';
      input.classList.remove('border-red-500', 'ring-red-500');
    } else if (exists) {
      input.classList.add('border-red-500', 'focus:ring-red-500');

      input.addEventListener('input', function removeError() {
        input.classList.remove('border-red-500', 'focus:ring-red-500');
        input.removeEventListener('input', removeError);
      });
    }
  };

  const renderTags = () => {
    container.innerHTML = dataArray
      .map(
        (item) => `
            <span class="tag bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                ${item}
                <i class="fas fa-times cursor-pointer hover:text-red-600" data-val="${item}"></i>
            </span>
        `
      )
      .join('');

    if (counter) {
      counter.textContent = `${dataArray.length} of ${minRequired} added`;
      counter.classList.toggle(
        'text-green-500',
        dataArray.length >= minRequired
      );
      counter.classList.toggle(
        'text-orange-500',
        dataArray.length < minRequired
      );
    }
  };

  btn.addEventListener('click', addTag);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  });

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('fa-times')) {
      const val = e.target.getAttribute('data-val');
      const index = dataArray.indexOf(val);
      if (index > -1) {
        dataArray.splice(index, 1);
        renderTags();
      }
    }
  });
  renderTags();
}

function initCompanyStep3() {
  const form = document.getElementById('companyStep3Form');
  const fileInput = document.getElementById('verificationFile');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const finishBtn = document.getElementById('finishBtn');

  // UI: File Name & Button Change
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        fileNameDisplay.textContent = e.target.files[0].name;
        fileNameDisplay.classList.add('text-green-600');

        const span = finishBtn.querySelector('span');
        if (span) span.textContent = 'Complete Registration';

        finishBtn.classList.remove('bg-green-500', 'hover:bg-green-600'); // Remove skip style
        finishBtn.classList.add('bg-blue-600', 'hover:bg-blue-700'); // Add upload style
      } else {
        fileNameDisplay.textContent = 'No file chosen';
        fileNameDisplay.classList.remove('text-green-600');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = finishBtn;
      const originalText = btn.innerHTML;

      try {
        // Scenario 1: Upload File
        if (fileInput.files.length > 0) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

          await companyService.uploadVerificationDoc(fileInput.files[0]);
          updateLocalRegistrationStep(4);
          swalDarkConfig({
            icon: 'success',
            title: 'Registration Complete!',
            text: 'Document uploaded. Redirecting to dashboard...',
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = '/Company_dashboard';
          });
        } else {
          // Scenario 2: Skip
          // بما أن الباك إند لا يحتوي على endpoint "skip" مخصص، سنوجه للداشبورد مباشرة
          // التوثيق سيظل "Unverified"
          updateLocalRegistrationStep(4);
          swalDarkConfig({
            icon: 'info',
            title: 'Skipping Verification',
            text: 'You can verify your company later from the dashboard.',
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = '/Company_dashboard';
          });
        }
      } catch (error) {
        console.error(error);
        swalDarkConfig({
          title:'Error',
          text:error.response?.data?.message || 'Operation failed',
          icon:'error'}
        );
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
    document.getElementById('backBtn')?.addEventListener('click', () => {
      window.location.href = '/CompanyStep2';
    });
  }
}
