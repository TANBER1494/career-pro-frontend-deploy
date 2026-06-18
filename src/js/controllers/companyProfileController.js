import { companyService } from '../services/companyService.js';
import { authService } from '../services/authService.js';
import Swal from 'sweetalert2';

// ============================================================
// 1. State & Variables
// ============================================================
let currentProfile = null;

// DOM Elements - View Mode
const viewMode = document.getElementById('viewMode');
const viewActions = document.getElementById('viewActions');
const viewLogo = document.getElementById('view-logo');
const viewLogoPlaceholder = document.getElementById('view-logo-placeholder');

// DOM Elements - Edit Mode
const editMode = document.getElementById('editMode');
const editActions = document.getElementById('editActions');
const logoInput = document.getElementById('input-logo');
const logoPreview = document.getElementById('edit-logo-preview');
const logoIcon = document.getElementById('edit-logo-icon');

// Buttons
const btnEditProfile = document.getElementById('btnEditProfile');
const btnCancelEdit = document.getElementById('btnCancelEdit');
const btnSaveChanges = document.getElementById('btnSaveChanges');
const btnUploadLogo = document.getElementById('btnUploadLogo');
const btnLogout = document.getElementById('btnLogout');

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
// 2. Initialization & Data Fetching
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  fetchProfileData();
});

async function fetchProfileData() {
  try {
    const res = await companyService.getProfile();
    currentProfile = res.data;
    renderViewMode(currentProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    swalDarkConfig({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load company profile. Please try again.',
    });
  }
}

// ============================================================
// 3. Render Functions (Updates UI)
// ============================================================
function renderViewMode(data) {
  const info = data.companyInfo || {};
  const details = data.companyDetails || {};

  // --- 1. Header Section (The missing part) ---
  setText('view-companyName', info.companyName);
  setText('view-industry', info.industry); // Tagline/Industry under name

  // Header Stats (Icons row)
  setText(
    'view-employees',
    info.companySize ? `${info.companySize} employees` : '--'
  );
  setText('view-founded', info.foundedYear);
  setText('view-location', info.location);

  // --- 2. Details Cards ---
  setText('view-industry-detail', info.industry);
  setText('view-employees-detail', info.companySize);
  setText('view-founded-detail', info.foundedYear);
  setText('view-location-detail', info.location);

  // Contact
  const webLink = document.getElementById('view-website');
  if (webLink) {
    webLink.textContent = info.website || '--';
    webLink.href = info.website || '#';
  }
  setText('view-phone', info.phone);

  // Description
  setText(
    'view-description',
    info.companyDescription || 'No description added.'
  );

  // --- 3. Lists (Technologies & Benefits) ---
  const techContainer = document.getElementById('view-technologies');
  if (techContainer) {
    techContainer.innerHTML = '';
    if (details.technologies && details.technologies.length > 0) {
      details.technologies.forEach((tech) => {
        techContainer.innerHTML += `<span class="tech-badge dark:text-slate-400">${tech}</span>`;
      });
    } else {
      techContainer.innerHTML =
        '<span class="text-gray-400 italic text-sm">No technologies listed.</span>';
    }
  }

  const benContainer = document.getElementById('view-benefits');
  if (benContainer) {
    benContainer.innerHTML = '';
    if (details.benefits && details.benefits.length > 0) {
      details.benefits.forEach((ben) => {
        benContainer.innerHTML += `<li class="dark:text-slate-400">${ben}</li>`;
      });
    } else {
      benContainer.innerHTML =
        '<li class="text-gray-400 italic">No benefits listed.</li>';
    }
  }

  // --- 4. Social Media ---
  const socialContainer = document.getElementById('view-socials');
  if (socialContainer) {
    socialContainer.innerHTML = '';
    const socials = details.socialMedia || {};
    let hasSocials = false;

    if (socials.linkedin) {
      socialContainer.innerHTML += createSocialLink(
        'linkedin',
        socials.linkedin,
        'text-blue-600'
      );
      hasSocials = true;
    }
    if (socials.twitter) {
      socialContainer.innerHTML += createSocialLink(
        'twitter',
        socials.twitter,
        'text-blue-400'
      );
      hasSocials = true;
    }
    if (socials.facebook) {
      socialContainer.innerHTML += createSocialLink(
        'facebook',
        socials.facebook,
        'text-blue-800'
      );
      hasSocials = true;
    }
    if (socials.instagram) {
      socialContainer.innerHTML += createSocialLink(
        'instagram',
        socials.instagram,
        'text-pink-600'
      );
      hasSocials = true;
    }

    if (!hasSocials) {
      socialContainer.innerHTML =
        '<span class="text-gray-400 italic text-sm">No social links added.</span>';
    }
  }

  // --- 5. Logo Handling ---
  if (info.logoUrl) {
    // التغيير: الرابط يأتي كاملاً من Cloudinary، لا داعي لفحص http أو إضافة localhost
    const fullLogoUrl = info.logoUrl;

    if (viewLogo) {
      viewLogo.src = fullLogoUrl;
      viewLogo.classList.remove('hidden');
    }
    if (viewLogoPlaceholder) viewLogoPlaceholder.classList.add('hidden');

    // Update Edit Mode Preview too
    if (logoPreview) {
      logoPreview.src = fullLogoUrl;
      logoPreview.classList.remove('hidden');
    }
    if (logoIcon) logoIcon.classList.add('hidden');
  }
}

// Helpers
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '--';
}

function createSocialLink(platform, url, colorClass) {
  return `<a href="${url}" target="_blank" class="text-2xl ${colorClass} hover:opacity-80 transition"><i class="fab fa-${platform}"></i></a>`;
}

// ============================================================
// 4. UI Interactions
// ============================================================

// Switch to Edit Mode
btnEditProfile.addEventListener('click', () => {
  if (currentProfile) populateEditForm(currentProfile);
  toggleView(true);
});

// Cancel Edit
btnCancelEdit.addEventListener('click', () => {
  toggleView(false);
});

function toggleView(isEdit) {
  if (isEdit) {
    viewMode.classList.add('hidden');
    viewActions.classList.add('hidden');
    editMode.classList.remove('hidden');
    editActions.classList.remove('hidden');
  } else {
    editMode.classList.add('hidden');
    editActions.classList.add('hidden');
    viewMode.classList.remove('hidden');
    viewActions.classList.remove('hidden');
  }
}

function populateEditForm(data) {
  const info = data.companyInfo || {};
  const details = data.companyDetails || {};
  const socials = details.socialMedia || {};

  // Step 1
  setValue('input-companyName', info.companyName);
  setValue('input-industry', info.industry);
  setValue('input-numberOfEmployees', info.companySize);
  setValue('input-foundedYear', info.foundedYear);
  setValue('input-location', info.location);
  setValue('input-phone', info.phone);
  setValue('input-website', info.website);
  setValue('input-companyDescription', info.companyDescription);

  // Step 2 (Arrays to String)
  setValue(
    'input-technologies',
    details.technologies ? details.technologies.join(', ') : ''
  );
  setValue(
    'input-benefits',
    details.benefits ? details.benefits.join(', ') : ''
  );

  // Socials
  setValue('input-linkedin', socials.linkedin);
  setValue('input-twitter', socials.twitter);
  setValue('input-facebook', socials.facebook);
  setValue('input-instagram', socials.instagram);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// ============================================================
// 5. Logo Upload Logic
// ============================================================
logoInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      logoPreview.src = e.target.result;
      logoPreview.classList.remove('hidden');
      logoIcon.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
});

btnUploadLogo.addEventListener('click', async (e) => {
  e.preventDefault();
  const file = logoInput.files[0];

  if (!file) {
    Swal.fire({
      Title:'Warning',
      text: 'Please select an image first.',
      icon: 'warning',
      background: isDarkMode ? '#1e1b4b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      confirmButtonColor: '#4361ee',
    });
    return;
  }

  try {
    const btn = document.getElementById('btnUploadLogo');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Uploading...';
    btn.disabled = true;

    await companyService.uploadLogo(file);

    swalDarkConfig({
      icon: 'success',
      title: 'Success',
      text: 'Company logo updated successfully!',
      timer: 1500,
      showConfirmButton: false,
    });

    btn.innerHTML = originalText;
    btn.disabled = false;
    fetchProfileData(); // Refresh UI
  } catch (error) {
    const isDarkMode = document.documentElement.classList.contains('dark');
    console.error(error);
    Swal.fire({
      Title:'Error',
      text: 'Failed to upload logo.',
      icon: 'error',
      background: isDarkMode ? '#1e1b4b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      confirmButtonColor: '#4361ee',
    });
    document.getElementById('btnUploadLogo').innerHTML = 'Upload';
    document.getElementById('btnUploadLogo').disabled = false;
  }
});

// ============================================================
// 6. Save Changes Logic
// ============================================================
btnSaveChanges.addEventListener('click', async (e) => {
  e.preventDefault();

  // 1. Collect Data for Step 1
  const step1Data = {
    companyName: getValue('input-companyName'),
    industry: getValue('input-industry'),
    numberOfEmployees: getValue('input-numberOfEmployees'),
    foundedYear: getValue('input-foundedYear'),
    location: getValue('input-location'),
    phone: getValue('input-phone'),
    website: getValue('input-website'),
    companyDescription: getValue('input-companyDescription'),
  };

  // 2. Collect Data for Step 2
  const technologiesStr = getValue('input-technologies');
  const benefitsStr = getValue('input-benefits');

  const step2Data = {
    technologies: technologiesStr
      ? technologiesStr
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s)
      : [],
    benefits: benefitsStr
      ? benefitsStr
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s)
      : [],
    linkedin: getValue('input-linkedin'),
    twitter: getValue('input-twitter'),
    facebook: getValue('input-facebook'),
    instagram: getValue('input-instagram'),
  };

  try {
    const submitBtn = document.getElementById('btnSaveChanges');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    // 3. Call Backend Services
    await Promise.all([
      companyService.updateProfileStep1(step1Data),
      companyService.updateProfileStep2(step2Data),
    ]);

    swalDarkConfig({
      icon: 'success',
      title: 'Profile Updated',
      text: 'Company information has been saved successfully.',
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      fetchProfileData(); // Refresh Data
      toggleView(false); // Switch to View Mode
    });
  } catch (error) {
    console.error('Update Error:', error);
    const isDarkMode = document.documentElement.classList.contains('dark');
    const message = error.response?.data?.message || 'Something went wrong';
    Swal.fire({
      Title:'Error',
      text: message,
      icon: 'error',
      background: isDarkMode ? '#1e1b4b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#1e293b',});
  } finally {
    const submitBtn = document.getElementById('btnSaveChanges');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    submitBtn.disabled = false;
  }
});

if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    authService.logout();
  });
}

const mobileSidebar = document.getElementById('mobileSidebar');
const openBtn = document.querySelector('.md\\:hidden'); // زرار البرجر في الـ Nav
const closeBtn = document.getElementById('closeSidebar');
const overlay = document.getElementById('closeSidebarOverlay');

// فتح المنيو
openBtn.onclick = () => {
  mobileSidebar.classList.remove('-translate-x-full');
};

// قفل المنيو
const closeMenu = () => {
  mobileSidebar.classList.add('-translate-x-full');
};

closeBtn.onclick = closeMenu;
overlay.onclick = closeMenu;

// توجيه الروابط (نفس المنطق اللي عندك)
document.querySelectorAll('#mobileSidebar li').forEach(item => {
  item.onclick = () => {
    const url = item.getAttribute('data-url');
    if (url) window.location.href = url;
  };
});
